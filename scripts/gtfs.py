"""Stream official GTFS, resolve stop_code to stop_id, and retain route-specific services."""
import csv
import io
import json
import os
import re
import sys
import tempfile
import urllib.request
import zipfile
from datetime import datetime, timezone

# Current official registry feed; the old peatus.ee ZIP URL now redirects to a closed app.
# https://www.agri.ee/regionaalareng-uhistransport/uhistransport-ja-reisimine/uhistranspordiregistri-avaandmed
GTFS_URL = 'https://eu-gtfs.remix.com/estonia_unified_gtfs.zip'

def rows(feed, name, optional=False):
    member = next((n for n in feed.namelist() if n.rsplit('/', 1)[-1] == name), None)
    if member is None:
        if optional:
            return
        raise ValueError(f'GTFS fail puudub: {name}')
    with feed.open(member) as raw:
        yield from csv.DictReader(io.TextIOWrapper(raw, encoding='utf-8-sig', newline=''))

def iso(value):
    return datetime.strptime(value, '%Y%m%d').strftime('%Y-%m-%d')

def seconds(value):
    h, m, s = map(int, value.split(':'))
    if h < 0 or not 0 <= m < 60 or not 0 <= s < 60:
        raise ValueError('Vigane GTFS kellaaeg')
    return h * 3600 + m * 60 + s

def process(feed, config):
    agency_ids = {r['agency_id'] for r in rows(feed, 'agency.txt') if re.search(config['agencyPattern'], r['agency_name'], re.I)}
    if not agency_ids:
        raise ValueError('Tallinna Linnatranspordi vedajat ei leitud')
    routes = {r['route_id'] for r in rows(feed, 'routes.txt') if r['route_short_name'] == config['route'] and r.get('agency_id') in agency_ids and (r['route_type'] == '3' or 700 <= int(r['route_type']) <= 799)}
    if not routes:
        raise ValueError('Tallinna linnabussi liini ei leitud')
    needed_codes = {d[k] for d in config['directions'] for k in ['originCode', 'destinationCode']}
    stops = {}
    for row in rows(feed, 'stops.txt'):
        if row.get('stop_code') in needed_codes:
            stops.setdefault(row['stop_code'], set()).add(row['stop_id'])
    if set(stops) != needed_codes:
        raise ValueError('Mõni nõutud peatusekood puudub GTFS-is')
    trips = {r['trip_id']: r['service_id'] for r in rows(feed, 'trips.txt') if r['route_id'] in routes}
    stop_ids = set().union(*stops.values())
    selected = {}
    for row in rows(feed, 'stop_times.txt'):
        if row['trip_id'] in trips and row['stop_id'] in stop_ids:
            selected.setdefault(row['trip_id'], []).append(row)
    directions = []
    service_ids = set()
    for direction in config['directions']:
        departures = []
        for trip_id, calls in selected.items():
            origins = [c for c in calls if c['stop_id'] in stops[direction['originCode']] and c.get('pickup_type', '0') != '1']
            destinations = [c for c in calls if c['stop_id'] in stops[direction['destinationCode']] and c.get('drop_off_type', '0') != '1']
            for origin in origins:
                destination = next((c for c in sorted(destinations, key=lambda c: int(c['stop_sequence'])) if int(c['stop_sequence']) > int(origin['stop_sequence'])), None)
                if destination:
                    dep, arr = seconds(origin['departure_time']), seconds(destination['arrival_time'])
                    if arr < dep:
                        raise ValueError('Saabumine eelneb väljumisele')
                    departures.append({'serviceId': trips[trip_id], 'departure': dep, 'arrival': arr})
                    service_ids.add(trips[trip_id])
        if not departures:
            raise ValueError(f"Suuna {direction['id']} väljumisi ei leitud")
        directions.append({'id': direction['id'], 'trips': sorted(departures, key=lambda t: t['departure'])})
    services = {}
    for row in rows(feed, 'calendar.txt', optional=True):
        if row['service_id'] in service_ids:
            weekdays = [i for i, name in enumerate(['sunday','monday','tuesday','wednesday','thursday','friday','saturday']) if row[name] == '1']
            services[row['service_id']] = {'startDate': iso(row['start_date']), 'endDate': iso(row['end_date']), 'weekdays': weekdays, 'exceptions': {}}
    for row in rows(feed, 'calendar_dates.txt', optional=True):
        if row['service_id'] in service_ids:
            service = services.setdefault(row['service_id'], {'startDate':'9999-12-31','endDate':'0001-01-01','weekdays':[], 'exceptions':{}})
            if row['exception_type'] not in ('1', '2'):
                raise ValueError('Vigane kalendrierand')
            service['exceptions'][iso(row['date'])] = 'added' if row['exception_type'] == '1' else 'removed'
    if service_ids - set(services):
        raise ValueError('Teeninduskalender puudub')
    # Frequency-only service cannot be represented as exact scheduled departures.
    if any(r['trip_id'] in trips for r in rows(feed, 'frequencies.txt', optional=True)):
        raise ValueError('Liini sageduspõhist teenust ei saa kuvada täpsete väljumistena')
    return {'updatedAt':datetime.now(timezone.utc).isoformat().replace('+00:00','Z'), 'timezone':'Europe/Tallinn','directions':directions,'services':services}

def main():
    config = json.loads(sys.argv[1])
    with tempfile.TemporaryFile() as archive:
        request = urllib.request.Request(GTFS_URL, headers={'User-Agent':'MinuDashboard/1.0'})
        with urllib.request.urlopen(request, timeout=180) as response:
            total = 0
            while chunk := response.read(1024 * 1024):
                total += len(chunk)
                if total > 1024 * 1024 * 1024:
                    raise ValueError('GTFS allalaadimine ületab 1 GB piiri')
                archive.write(chunk)
        archive.seek(0)
        with zipfile.ZipFile(archive) as feed:
            result = process(feed, config)
        path = 'public/data/bus25.json'
        with open(path + '.tmp', 'w', encoding='utf-8') as out:
            json.dump(result, out, ensure_ascii=False, separators=(',', ':'))
            out.write('\n')
        os.replace(path + '.tmp', path)
        print('GTFS: mõlemad suunad ja teeninduskalendrid salvestatud.')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'Sõiduplaan säilitati: {error}', file=sys.stderr)
        sys.exit(1)
