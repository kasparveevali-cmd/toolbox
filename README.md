# Minu Dashboard

Eestikeelne isiklik päevaülevaade: neli lühikest uudist, seitse maailma börsiindeksit, bussi 25 järgmised väljumised ning kahe koha järgmise kaheksa täistunni ilm. React, TypeScript ja Vite; majutus GitHub Pagesis. Tavapärast taustaserverit pole vaja.

## Privaatsus

Rakendus ei kogu ega salvesta külastaja andmeid. Puuduvad kontod, sisselogimine, küpsised, analüütika, jälgimine, sõrmejäljestamine ja telemeetria. Rakendus ei kasuta localStorage'it, sessionStorage'it, IndexedDB-d ega service worker'it. Bussi suunavalik elab ainult Reacti mälus ja lähtestub lehe värskendamisel. Seadme asukohta ei küsita.

`public/data/` sisaldab ainult avalikke uudiseid, börsiandmeid ja sõiduplaani. Ilm laaditakse lehe avamisel otse Open-Meteost, ilma API võtme, küpsiste või viitaja päiseta; koordinaadid on ette määratud. Rakendus ei logi külastaja tegevust. Veebimajutaja GitHub ja ilmateenuse pakkuja näevad tavapärase ühenduse käigus IP-aadressi ning nende enda serverilogidele kehtivad nende reeglid. Nende logide puudumist ei saa see rakendus garanteerida.

Ühtki API võtit ei lisata brauserikoodi. Valikuline OpenAI võti on ainult GitHub Actionsi repository secret; brauser ei pöördu OpenAI poole.

## Käivita oma arvutis

Paigalda **Node.js 24 LTS** (vähemalt 24.6) ja **Python 3.12 või uuem**. Ava terminal selle projekti kaustas ja kopeeri:

```sh
npm ci
npm run dev
```

Ava terminalis näidatud aadressi `/toolbox/` tee. Arendusserveri lõpetamiseks vajuta `Ctrl+C`.

Avalike andmete värskendamine (internet peab lubama allpool nimetatud andmeallikaid):

```sh
npm run update:data
```

Eraldi uuendamiseks:

```sh
npm run update:news
npm run update:markets
npm run update:gtfs
```

Need käsud ei vaja salajasi võtmeid. OpenAI kokkuvõtteid tehakse ainult Actionsis. Node'i uuenduskäsud toetavad keskkonna HTTPS-proksit ja süsteemi usaldatud sertifikaate; TLS-kontroll jääb sisse.

## Kontrolli ja ehita

```sh
npm run typecheck
npm test
npm run build
npx tsx scripts/audit-build.ts
npx playwright install chromium
npm run test:browser
npm run preview
```

Kui Chromium on juba paigaldatud, saab Linuxis kasutada `BROWSER_PATH=/usr/bin/chromium npm run test:browser`.

Valmis leht on kaustas `dist/`. Ehituse audit otsib keelatud püsimälu, jälgimist ja OpenAI võtmeid ning kontrollib GitHub Pagesi baasteed. Loogikatestid kontrollivad kalendrierandeid, üle 24 tunni GTFS-aegu, suve-/talveaega, lõpetatud börsisessioone ja ilma keskööloogikat. Brauseritestid kontrollivad töölaua- ja mobiilivaadet, mõlemat sõidusuunda, veaseisundeid ja privaatsust. Testandmed on ainult testides; neid ei avaldata.

## Avalda GitHub Pagesis

1. Laadi projekti failid repositooriumi `kasparveevali-cmd/toolbox` **main**-harusse.
2. Ava GitHubis **Settings → Pages**. Vali **Source: GitHub Actions**.
3. Töövoog määrab andmeuuenduseks vajaliku **contents: write** õiguse ise; repositooriumi üldisi vaikeõigusi ei ole tavaliselt vaja laiendada. Kui organisatsiooni poliitika või `main`-haru kaitse takistab bot-commit'i, tuleb lubada andmeuuendaja kirjutamine eraldi; võtit brauserisse ei lisata.
4. Ava **Actions → Refresh public data → Run workflow**, et laadida esimesed andmed.
5. **Deploy GitHub Pages** käivitub `main`-haru muudatuse järel ja ka andmeuuenduse lõppedes. Avaliku lehe aadress ilmub GitHubi Pagesi seadetes.

Avaldamine käib ka käsitsi **Actions → Deploy GitHub Pages → Run workflow** kaudu. Töövoog kontrollib andmefaile, teste, TypeScripti, ehitust ja brauserikäitumist enne avaldamist.

`vite.config.ts` kasutab projektile sobivat `base: '/toolbox/'`. Kui muudad repositooriumi nime, muuda seal baasteed ning `scripts/audit-build.ts` kontrolli. Isikliku juurdomeeni puhul kasuta baasteed `/`.

Andmeuuendus toimub vaikimisi iga kahe tunni tagant (UTC). Uudiseid värskendatakse igal korral, turgusid mitte sagedamini kui kuue tunni ja GTFS-i mitte sagedamini kui 24 tunni järel. GitHub võib ajastatud töid viivitada või pika tegevusetuse järel peatada; neid saab alati käsitsi käivitada. Andmefailide bot-commit ei käivita ise uut andmeuuendust. Eraldi `workflow_run` avaldab muutunud andmed, kuna `GITHUB_TOKEN`-iga tehtud commit ei käivita tavalist push-töövoogu. Uuenduste konkurents on piiratud ühe tööga.

## Kas mul on vaja saladusi lisada?

**Kohustuslikke API saladusi pole.** GitHubi automaatne `GITHUB_TOKEN` antakse Actionsile platvormi poolt.

Soovi korral lisa **Settings → Secrets and variables → Actions → New repository secret** all **OPENAI_API_KEY**. See loob lühikesed eestikeelsed kokkuvõtted ainult avalike RSS-pealkirjade ja kirjelduste põhjal. Võtit ei sisestata projekti faili, vestlusse, Vite'i `VITE_*` muutujasse ega avalikesse JSON-andmetesse.

Ilma võtmeta kasutatakse ERR-i eestikeelset pealkirja ja lühendatud RSS-kirjeldust. Juba kokku võetud sama URL-i kohta uut AI-päringut ei tehta. Kui AI ei vasta, toimib RSS-varuvariant. Mudeli vaikeseade on `gpt-4o-mini`; seda saab muuta serveripoolses skriptis.

## Kuidas andmed liiguvad?

**Uudised.** `scripts/providers/news.ts` loeb ERR-i ja ERR Novaatori RSS-i, välistab vanad, tulevikku dateeritud ja sobimatud artiklid ning valib kategooria järgi erinevad lood. Valik on lihtne läbipaistev reeglipõhine esmane toimetusfilter, mitte inimese tehtud uudisvalik. Täispikki artikleid ei kopeerita. Allikaid ja valikureegleid saab samas failis muuta. Tulemused kirjutatakse `public/data/news.json` faili. Igal lool säilib avaldamisaeg ja algallika HTTPS-link.

**Turud.** `scripts/providers/markets.ts` on vahetatav Yahoo Finance'i päevagraafiku adapter. `src/config/indices.ts` määrab seitse indeksit, börside ajavööndid ja konservatiivsed sulgemisajad. Tänase sessiooni väärtus jäetakse välja kuni sulgemise ja 30-minutilise varuni; eelmised sessioonid leitakse allika tegelikest kauplemiskuupäevadest, mitte kalendri „eilsest“. Päevane muutus arvutatakse kahe lõpetatud sulgemise vahel. `^OMXTGI` on OMX Tallinna ajaloolise rea sümbol. Kui üks indeks ebaõnnestub, säilib selle viimane väärtus koos eraldi kontrolliajaga. Yahoo avalik lõpp-punkt ei anna teenusetaseme garantiid ning võib piirata päringuid; tõsisema või ärilise kasutuse jaoks saab adapteri asendada litsentsitud allikaga.

**Buss.** `src/config/dashboard.ts` määrab liini, vedaja ning mõlema suuna peatusekoodid. `scripts/gtfs.py` töötleb ametliku ZIP-faili CSV-ridu voona, leiab `stop_code` kaudu sisemised `stop_id` väärtused ning kontrollib peatuste järjekorda ja vedajat. Allikas on registri praegune ühendatud voog `https://eu-gtfs.remix.com/estonia_unified_gtfs.zip` ([registri avaandmed](https://www.agri.ee/regionaalareng-uhistransport/uhistransport-ja-reisimine/uhistranspordiregistri-avaandmed)). Vana `peatus.ee/gtfs/gtfs.zip` suunab nüüd suletud rakenduse HTML-lehele; seda ei kasutata. Brauserisse lähevad ainult liini 25 väljumised ja vajalikud kalendrid. Arvestatakse nii tavalisi nädalapäevi kui `calendar_dates.txt` erandeid, ka ainult eranditega teenuseid, üle 24 tunni aegu ning GTFS-i keskpäevaankrut suve-/talveaja vahetusel. Sageduspõhist teenust ei esitata ekslikult täpsete aegadena. Brauser leiab valitud suuna kolm järgmist graafikujärgset väljumist jooksva Tallinna aja järgi. Need ei ole reaalajas sõiduki asukohaandmed.

**Ilm.** Muuda kohti ja koordinaate failis `src/config/locations.ts`. Liivalaia ja Tiskreoja jaoks on määratud esinduslikud punktid. Open-Meteo tagastab Unix-ajatemplid, nii et järgmised kaheksa täistundi valitakse korrektselt ka keskööl ja kella keeramisel. Mõlema koha päring ja veaseisund on sõltumatud. Open-Meteo tasuta teenuse puhul järgi selle mitteärilise kasutuse tingimusi; allikaviide on ka lehel.

Ühe allika rikke korral viimast kehtivat avalikku andmefaili ei kustutata. Tühja andmestiku korral kuvatakse rahulik teade. Aegunud andmed on märgitud; väärtusi ega väljumisaegu ei mõelda välja. `scripts/validate-data.ts` ja brauser kontrollivad JSON-skeeme.

## Kõige olulisemad failid

- `src/App.tsx`: päis, Tallinna kell ja vidinate paigutus.
- `src/components/`: uudised, turud, buss, ilm ja jagatud seisundid.
- `src/styles.css`, `src/tokens.css`: mobiili- ja töölauavaade ning kujunduse muutujad.
- `src/config/locations.ts`: ilmakohad.
- `src/config/dashboard.ts`: saidi nimi ja bussipeatused.
- `src/config/indices.ts`: börsiindeksid.
- `scripts/`: avalike andmete uuendamine ja kontrollid; saladusi kasutav kood asub ainult siin.
- `.github/workflows/`: andmeuuendus ja Pagesi avaldamine.

Uue vidina lisamiseks loo komponent `src/components/` alla ning lisa see `App.tsx` paigutusse. Ära lisa kasutajakontosid, jälgimist ega brauseri püsimälu.

## Esmase kontrolli seis

Uudiste mõlemad RSS-allikad, kõigi seitsme indeksi ajaloo laadimine ja mõlema ilmapunkti pärisprognoosi töötlemine on selles pilvekeskkonnas kontrollitud. TypeScript, tootmisehitus, seitse JavaScripti loogikatesti, kolm GTFS-i CSV/ZIP-testi ja kaheksa töölaua-/mobiilibrauseritesti läbivad kontrolli. Brauseritestides kasutatakse võrguseisundite ja ajapiiride kontrollimiseks eraldi testandmeid. Lisaks renderdusid pärisuudised, kõik seitse turuväärtust ning mõlema koha kaheksa ilmatundi 1440 ja 390 piksli vaates, ilma lehevea või horisontaalse ülejooksuta. Selle lisakontrolli ilmapäringud suunati läbi TLS-i kontrolliva Node'i transpordi; Chromiumi usalduspoliitikat ei muudetud. ERR-i artiklilehed vastasid selles keskkonnas 403-ga, mistõttu nende serveri kättesaadavust ei saanud kinnitada; lingid tulevad päris-RSS-ist ning nende turvaatribuudid on kontrollitud.

**Bussi pärisandmed on nüüd kontrollitud:** ametlik ühendatud GTFS-voog laaditi edukalt ning `bus25.json` sisaldab mõlema suuna pärisväljumisi ja kalendreid. Peatusekoodid leiti sisemistest peatuse-ID-dest eraldi, vedaja ja peatuste järjestus kontrolliti. Vaikimisi suunas on 122 ja vastassuunas 125 teenusepõhist väljumiskirjet; mõlemast leiti jooksva Tallinna aja järgi järgmised kolm väljumist. Edaspidi uuendab sõiduplaani GitHub Actions.

Pilvekeskkonna Chromiumi pärisilma võrgupäring vajab platvormi proksisertifikaadi usaldamist. Turvalise serveripoolse Node'i TLS-ühenduse ja brauseri kasutajaliidese loogika kontrollid on läbitud; Chromiumis tegeliku proksitud ilmapäringu õnnestumist ei väideta. Sertifikaadikontrolli pole välja lülitatud. Avaldamise töövoog on valmis; Pagesi esmane sisselülitamine **Settings → Pages → Source: GitHub Actions** vajab repositooriumi seadete haldamisõigust. Tavaline töövoo `GITHUB_TOKEN` ei saa Pagesi esimest korda sisse lülitada.
