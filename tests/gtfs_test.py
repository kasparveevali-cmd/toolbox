import importlib.util
import io
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('gtfs', 'scripts/gtfs.py')
gtfs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gtfs)

class GTFSTest(unittest.TestCase):
    def feed(self, calendar=True):
        buffer = io.BytesIO()
        files = {
            'agency.txt':'agency_id,agency_name\ncity,Tallinna Linnatranspordi AS\nother,Other\n',
            'routes.txt':'route_id,route_short_name,route_type,agency_id\nr,25,700,city\nwrong,25,3,other\n',
            'stops.txt':'stop_id,stop_code\na,12301-1\nb,47226-1\nc,47225-1\nd,13103-1\n',
            'trips.txt':'route_id,service_id,trip_id\nr,s,t1\nr,s,t2\nwrong,s,t3\n',
            'stop_times.txt':'trip_id,stop_id,stop_sequence,arrival_time,departure_time,pickup_type,drop_off_type\nt1,a,1,25:00:00,25:00:00,0,1\nt1,b,2,25:35:00,25:35:00,1,0\nt2,d,1,10:00:00,10:00:00,0,0\nt2,c,2,10:30:00,10:30:00,0,0\nt2,d,3,11:00:00,11:00:00,0,0\nt3,a,1,09:00:00,09:00:00,0,0\nt3,b,2,09:20:00,09:20:00,0,0\n',
            'calendar_dates.txt':'service_id,date,exception_type\ns,20261006,2\ns,20261010,1\n',
        }
        if calendar:
            files['calendar.txt']='service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\ns,1,1,1,1,1,0,0,20260101,20261231\n'
        with zipfile.ZipFile(buffer, 'w') as feed:
            for name, content in files.items(): feed.writestr(name, content)
        buffer.seek(0)
        return zipfile.ZipFile(buffer)

    def config(self):
        return {'route':'25','agencyPattern':'Tallinna Linnatranspor[td]','directions':[{'id':'outbound','originCode':'12301-1','destinationCode':'47226-1'},{'id':'inbound','originCode':'47225-1','destinationCode':'13103-1'}]}

    def test_stop_code_route_agency_sequence_and_terminal(self):
        with self.feed() as feed: data = gtfs.process(feed,self.config())
        self.assertEqual(data['directions'][0]['trips'],[{'serviceId':'s','departure':90000,'arrival':92100}])
        self.assertEqual(data['directions'][1]['trips'],[{'serviceId':'s','departure':37800,'arrival':39600}])
        self.assertEqual(data['services']['s']['weekdays'],[1,2,3,4,5])
        self.assertEqual(data['services']['s']['exceptions'],{'2026-10-06':'removed','2026-10-10':'added'})

    def test_calendar_dates_only_feed(self):
        with self.feed(False) as feed: data = gtfs.process(feed,self.config())
        self.assertEqual(data['services']['s']['weekdays'],[])
        self.assertEqual(data['services']['s']['exceptions']['2026-10-10'],'added')

    def test_invalid_stop_codes_fail_without_producing_fabricated_times(self):
        config = self.config()
        config['directions'][0]['originCode'] = 'missing'
        with self.feed() as feed:
            with self.assertRaises(ValueError): gtfs.process(feed,config)

if __name__ == '__main__': unittest.main()
