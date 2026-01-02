import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse the vehicle data from the parsed-vehicles-full.txt format
const VEHICLE_DATA = `Acura|CSX 4 Door Sedan|2006-2011|68.0|24.3|13.8|27.6|201.7
Acura|EL Series 4-Door|2001-2002|68.0|26.1|17.9|22.8|202.7
Acura|Integra 3-Door|1989-1993|61.7|23.9|22.1|20.0|189.3
Acura|Integra 3-Door|2000-2002|60.8|23.5|22.1|15.0|182.3
Acura|Integra 5-Door|1989-1993|68.5|24.5|23.0|22.2|206.8
Acura|Intergra 4-Door Sedan|1994-2002|67.0|24.9|21.5|19.2|199.5
Acura|MDX|2000-2006|82.3|30.1|18.3|34.1|247.1
Acura|MDX|2007-2012|77.8|31.7|19.7|40.0|247.1
Acura|RDX|2007-2012|75.8|28.8|19.6|37.3|237.3
Acura|RSX Coupe|2001-2006|65.8|22.7|19.1|13.7|187.0
Acura|TLX|2015-2020|76.6|27.3|28.6|29.5|238.7
Acura|MDX|2014-2020|76.4|29.9|23.8|42.5|248.9
Audi|A3 Wagon|2006-2008|62.6|24.8|15.8|33.4|199.2
Audi|A4|2001-2005|69.1|24.8|16.0|24.3|203.3
Audi|A4 Allroads|2000-2006|63.4|16.9|15.3|30.7|189.7
Audi|A4 Avant Wagon|2002-2008|63.3|21.5|15.0|33.3|196.4
Audi|Q7|2007-2008|86.8|31.1|25.8|45.6|276.2
Audi|TT Coupe|2000-2006|61.9|30.1|15.6|16.7|186.1
Audi|TT Coupe|2007-2014|61.5|26.5|20.1|19.5|189.1
Austin|Mini Cooper|-|42.9|22.8|10.7|24.7|144.0
BMW|3 Series|2005-2011|68.3|24.8|22.9|23.8|208.2
BMW|3 Series Coupe|2001-2005|67.0|26.5|22.8|19.2|202.5
BMW|3 Series Saloon|2001-2005|69.6|28.0|22.6|22.5|212.2
BMW|I3|2014-2020|69.3|27.9|16.8|37.1|220.4
BMW|Mini Cooper|2002-2007|50.7|23.6|14.0|24.9|163.9
BMW|Mini Cooper Convertible|2002-2007|50.3|23.6|14.0|0|138.2
BMW|Mini Cooper S|2002-2007|50.7|23.6|14.0|24.9|163.9
BMW|X3|2003-2010|67.7|19.5|24.6|35.6|215.1
BMW|X5|2000-2008|71.9|29.2|18.4|31.5|222.9
BMW|Z3 Convertible|1999-2002|49.2|16.5|18.4|0|133.3
BMW|Z3 Coupe|1999-2002|49.5|16.5|19.4|19.6|154.5
BMW|Z4 Roadster|2003-2004|42.0|17.4|26.2|0|127.7
Buick|Enclave|2008-2017|76.4|25.8|18.9|48.3|245.8
Buick|Encore|2014-2020|73.7|29.4|17.5|21.2|215.4
Buick|Park Avenue|1998-2000|86.3|31.3|27.7|28.5|260.1
Buick|Rainier|2004-2007|83.7|30.8|21.7|38.6|258.4
Buick|Regal 4-Door|1998-1999|72.2|28.8|24.2|23.7|221.2
Buick|Rendezvous|2001-2008|82.1|30.1|20.9|46.7|261.9
Buick|Terrazza|2005-2008|95.2|32.2|19.7|46.7|289.0
Cadillac|CTS|2003-2007|70.3|25.0|19.9|21.7|207.1
Cadillac|De Ville|2000-2001|71.8|29.7|26.4|26.9|226.6
Cadillac|Escalade|1999-2000|91.7|30.1|27.6|43.5|284.7
Cadillac|Escalade|2001-2006|88.9|35.9|23.6|50.0|287.4
Cadillac|Escalade|2007-2014|94.0|36.6|23.3|52.1|299.9
Cadillac|Escalade ESV|2001-2006|96.4|35.9|23.6|33.8|286.0
Cadillac|Escalade ESV|2007-2014|102.7|36.6|23.3|60.7|326.0
Cadillac|EXT|2002-2006|97.0|27.2|23.6|57.6|302.5
Cadillac|SRX|2005-2009|86.4|29.1|24.8|44.7|271.4
Chevrolet|Astro|1999-2008|86.3|33.9|15.3|54.2|276.1
Chevrolet|Astro – Extended|1993-1998|83.7|35.4|13.4|52.9|269.2
Chevrolet|Astro – Short|1993-1998|79.6|35.4|13.4|49.8|257.7
Chevrolet|Avalanche|2001-2006|100.0|27.2|26.4|28.5|282.1
Chevrolet|Avalanche|2007-2014|104.7|34.9|28.8|34.8|307.8
Chevrolet|Aveo 4-Door Sedan|2002-2011|68.8|27.5|18.6|23.3|207.0
Chevrolet|Aveo 5-Door Wagon|2002-2011|62.2|28.3|18.6|24.7|196.0
Chevrolet|Blazer|2019-2020|84.2|30.8|33.0|44.6|276.9
Chevrolet|Bolt|2017-2020|69.1|26.9|16.8|30.5|212.3
Chevrolet|Camaro|1993-2002|67.1|28.2|27.9|16.3|206.7
Chevrolet|Camaro|2009-2016|70.9|27.0|26.3|21.4|216.5
Chevrolet|Camaro RS|2016-2020|68.3|25.4|26.4|27.8|216.1
Chevrolet|Camaro SS|2016-2020|68.3|25.4|26.4|27.8|216.1
Chevrolet|Caprice|2010-2020|82.5|26.7|24.9|22.4|239.1
Chevrolet|Cavalier 2-Door|1995-2002|65.8|25.8|23.7|16.3|197.3
Chevrolet|Cavalier 2-Door|2003-2005|63.9|21.1|20.1|16.0|184.9
Chevrolet|Cavalier 4-Door|1995-2002|67.2|25.8|22.8|19.4|202.4
Chevrolet|Cavalier 4-Door|2003-2005|62.5|21.1|18.0|21.1|185.1
Chevrolet|City Express|2013-2020|88.0|33.0|19.5|42.5|271.0
Chevrolet|Cobalt 2 Door|2004-2010|68.2|24.9|19.4|21.6|202.3
Chevrolet|Cobalt 4 Door|2004-2010|68.6|24.2|19.5|26.5|207.3
Chevrolet|Colorado - Crew Cab Long Box|2015-2020|91.0|31.6|25.3|29.4|268.3
Chevrolet|Colorado - Crew Cab Short Box|2015-2020|86.3|31.6|25.3|29.4|258.9
Chevrolet|Colorado - Ext Cab Long Box|2015-2020|86.5|31.6|25.3|23.2|253.1
Chevrolet|Colorado Crew Cab 5ft Box|2004-2014|84.4|26.2|19.1|26.9|240.9
Chevrolet|Colorado Ext Cab 6ft Box|2004-2014|81.7|26.2|19.1|15.8|224.5
Chevrolet|Colorado Reg Cab 6ft Box|2004-2014|71.6|26.2|19.1|15.8|204.3
Chevrolet|Corvette C5|1997-2004|60.8|26.7|32.5|14.0|194.9
Chevrolet|Corvette C6|2005-2014|59.2|23.5|23.7|15.3|180.9
Chevrolet|Corvette C7|2015-2019|60.8|21.8|31.0|34.7|209.0
Chevrolet|Corvette C7 Convertable|2015-2019|60.8|21.8|31.0|0|174.4
Chevrolet|Cruze|2008-2015|71.0|27.3|23.1|23.5|215.8
Chevrolet|Cruze|2016-2020|70.4|26.3|24.4|29.9|221.3
Chevrolet|Cruze Hatch|2016-2020|67.7|25.1|23.9|34.3|218.7
Chevrolet|Equinox|2005-2008|79.6|28.1|18.8|38.1|244.2
Chevrolet|Equinox|2009-2017|72.6|27.4|22.7|31.9|227.2
Chevrolet|Equinox|2018-2020|79.2|29.7|24.1|39.7|251.9
Chevrolet|Express Vans – Panel – 135" WB|1997-2002|112.3|36.5|14.8|74.9|350.7
Chevrolet|Express Vans – Panel – 135" WB|1997-2002|112.6|36.5|14.8|74.9|351.4
Chevrolet|Express Vans – Panel – 135" WB|2003-2020|107.0|36.5|14.8|74.9|340.2
Chevrolet|Express Vans – Panel – 135" WB|2003-2020|106.3|36.5|14.8|74.9|338.9
Chevrolet|Express Vans – Panel – 155" WB|1997-2002|123.3|36.5|14.8|81.7|379.6
Chevrolet|Express Vans – Panel – 155" WB|1997-2002|123.2|36.5|14.8|81.7|379.4
Chevrolet|Express Vans – Panel – 155" WB|2003-2020|121.8|36.5|14.8|81.7|376.6
Chevrolet|Express Vans – Panel – 155" WB|2003-2020|126.1|36.5|14.8|81.7|385.2
Chevrolet|Express Vans – Panel – Long|1993-1996|107.9|37.5|11.8|79.6|344.8
Chevrolet|Express Vans – Panel – Medium|1993-1996|99.2|37.5|11.8|70.3|318.0
Chevrolet|Express Vans – Panel – Short|1993-1996|85.9|37.5|11.8|57.7|278.8
Chevrolet|Express Vans – Window – Long|1993-1996|108.0|37.5|11.8|79.6|344.8
Chevrolet|Express Vans – Window – Medium|1993-1996|99.2|37.5|11.8|70.3|318.0
Chevrolet|Express Vans – Window – Short|1993-1996|85.9|37.5|11.8|57.7|278.8
Chevrolet|HHR|2005-2011|71.2|28.0|20.9|39.7|230.9
Chevrolet|HHR Panel|2005-2011|70.9|27.6|19.7|37.9|227.0
Chevrolet|Impala|2000-2005|81.3|27.8|28.4|21.9|240.6
Chevrolet|Impala|2006-2013|79.8|25.8|25.7|25.1|236.2
Chevrolet|Impala|2014-2020|79.8|27.1|26.9|29.7|243.3
Chevrolet|K-Series, Silverado – Club Cab/Long Bed|1993-1998|109.5|28.2|25.9|29.1|302.2
Chevrolet|K-Series, Silverado – Club Cab/Short Bed|1993-1998|99.5|28.2|25.9|29.1|282.2
Chevrolet|K-Series, Silverado – Club Cab/Stepside|1993-1998|99.5|27.8|25.9|29.1|281.8
Chevrolet|K-Series, Silverado – Crew Cab/Long Bed|1993-1998|116.8|28.2|25.9|34.8|322.5
Chevrolet|K-Series, Silverado – Ext Cab/Long Bed|1999-2002|107.6|27.3|25.9|28.0|296.3
Chevrolet|K-Series, Silverado – Ext Cab/Short Bed|1999-2002|98.5|27.3|25.9|28.0|278.2
Chevrolet|K-Series, Silverado – Reg Cab/Long Bed|1993-1998|99.0|28.2|25.9|18.0|270.2
Chevrolet|K-Series, Silverado – Reg Cab/Long Bed|1999-2002|96.6|27.3|25.9|18.0|264.5
Chevrolet|K-Series, Silverado – Reg Cab/Short Bed|1993-1998|90.0|28.2|25.9|18.0|252.1
Chevrolet|K-Series, Silverado – Reg Cab/Short Bed|1999-2002|88.8|27.3|25.9|18.0|248.7
Chevrolet|K-Series, Silverado – Reg Cab/Stepside|1993-1998|90.0|27.8|25.9|18.0|251.7
Chevrolet|K-Series, Yukon, Jimmy, Suburban – K-Blazer / 2 Door|1993-2000|78.9|27.9|25.4|42.6|253.7
Chevrolet|Lumina|1995-2001|78.3|27.8|24.8|18.3|227.4
Chevrolet|Malibu|2008-2012|74.2|26.4|23.4|24.8|222.9
Chevrolet|Malibu|2013-2016|74.7|24.9|22.6|24.8|221.6
Chevrolet|Malibu|2016-2017|76.2|27.1|28.4|31.5|239.4
Chevrolet|Malibu 4-Door|1997-2003|65.7|27.3|21.5|20.3|200.7
Chevrolet|Malibu 4-Door|2004-2007|69.9|26.0|21.8|26.9|214.5
Chevrolet|Malibu Maxx|2004-2007|70.7|25.8|21.8|28.5|217.4
Chevrolet|Monte Carlo|1995-2000|74.4|30.2|24.3|18.6|221.8
Chevrolet|Monte Carlo|2001-2007|79.3|24.1|27.5|19.7|230.1
Chevrolet|Optra 4-Door Sedan|2004-2007|65.6|25.7|19.2|24.6|200.6
Chevrolet|Optra 5 Wagon|2004-2007|62.8|23.5|19.6|27.4|196.2
Chevrolet|Orlando|2010-2020|73.3|25.2|23.3|37.8|233.0
Chevrolet|S-10 4 Door|2001-2005|74.5|29.5|18.1|28.5|225.1
Chevrolet|S-10, Jimmy – S-Blazer / 2 Door|1993-1994|68.6|21.9|21.6|30.1|210.7
Chevrolet|S-10, Jimmy – S-Blazer / 2 Door|1995-2005|71.4|29.0|23.2|38.3|233.3
Chevrolet|S-10, Jimmy – S-Blazer / 4 Door|1993-1994|70.7|21.9|21.6|34.0|218.9
Chevrolet|S-10, Jimmy – S-Blazer / 4 Door|1995-2005|71.3|29.0|23.2|42.5|237.3
Chevrolet|Silverado – 4 door 5'5 box|2014-2018|96.4|35.3|31.3|35.9|295.4
Chevrolet|Silverado – 4 door 6'5 box|2014-2018|100.7|35.3|31.3|35.9|304.0
Chevrolet|Silverado – 4 Door Dually|2001-2007|116.3|27.3|23.3|34.9|318.0
Chevrolet|Silverado – 4 Door Long Box|2001-2007|116.3|27.3|23.3|34.9|318.1
Chevrolet|Silverado – 4 Door Short Box|2001-2007|107.3|27.3|23.3|34.9|300.1
Chevrolet|Silverado – Crew Cab Long box|2008-2013|110.7|35.2|27.2|36.4|320.1
Chevrolet|Silverado – Crew Cab Short box|2008-2013|98.6|35.2|27.2|36.4|296.0
Chevrolet|Silverado – Ext Cab 5'5 box|2014-2018|92.7|35.3|31.3|31.2|283.2
Chevrolet|Silverado - Ext Cab 6'5 box|2014-2018|95.9|35.3|31.3|31.5|289.8
Chevrolet|Silverado – Ext Cab Dually|2001-2007|107.4|27.3|23.3|31.9|297.3
Chevrolet|Silverado – Ext Cab Flareside|2001-2007|99.1|27.3|23.3|31.9|280.6
Chevrolet|Silverado – Ext Cab Long box|2008-2013|105.9|35.2|27.2|31.2|305.4
Chevrolet|Silverado – Ext Cab Short box|2008-2013|93.9|35.2|27.2|32.6|282.7
Chevrolet|Silverado – Ext Cab Standard box|2008-2013|97.7|35.2|27.2|32.6|290.5
Chevrolet|Silverado – Ext Cab/Long Bed|2001-2007|106.2|27.3|23.3|31.9|294.8
Chevrolet|Silverado – Ext Cab/Short Bed|2001-2007|97.4|27.3|23.3|31.9|277.2
Chevrolet|Silverado - Reg Cab 6'5 box|2014-2018|86.5|35.3|31.3|19.2|258.8
Chevrolet|Silverado - Reg Cab 8' box|2014-2018|95.1|35.3|31.3|19.2|276.0
Chevrolet|Silverado – Reg Cab Dually|2001-2007|95.3|27.3|23.3|21.1|262.2
Chevrolet|Silverado – Reg Cab Flareside|2001-2007|106.3|27.3|23.3|21.1|284.2
Chevrolet|Silverado – Reg Cab Long box|2008-2013|94.3|35.2|27.2|20.8|271.8
Chevrolet|Silverado – Reg Cab Standard box|2008-2013|86.5|35.2|27.2|21.7|257.2
Chevrolet|Silverado – Reg Cab/Long Bed|2001-2007|95.1|27.3|23.3|21.1|261.8
Chevrolet|Silverado – Reg Cab/Short Bed|2001-2007|87.4|27.3|23.3|21.1|246.5
Chevrolet|Silverado 1500 - Crew Cab - 5'10 box|2019-2020|113.2|36.7|31.8|33.4|328.3
Chevrolet|Silverado 1500 - Crew Cab - 6'8 box|2019-2020|118.2|36.7|31.8|33.4|338.3
Chevrolet|Silverado 1500 - Double Cab - 6'8 box|2019-2020|113.5|36.7|31.8|29.6|325.1
Chevrolet|Silverado 1500 - Regular Cab - 8' box|2019-2020|112.4|36.7|31.8|21.3|314.5
Chevrolet|Silverado 2500 - Crew Cab - 6'8 box|2019-2020|113.4|36.6|32.9|36.1|332.5
Chevrolet|Silverado 2500 - Double Cab - 6'8 box|2019-2020|109.0|36.6|32.9|33.1|320.7
Chevrolet|Silverado 3500 - Crew Cab - 6'8 box|2019-2020|113.4|36.6|32.9|36.1|332.5
Chevrolet|Silverado 3500 - Double Cab - 6'8 box|2019-2020|109.0|36.6|32.9|33.1|320.7
Chevrolet|Sonic 4 Door Sedan|2012-2020|70.5|27.0|13.4|19.0|200.3
Chevrolet|Sonic 5 Door Hatchback|2012-2020|65.3|27.7|15.7|29.8|203.7
Chevrolet|Sonoma Club Cab/Long Bed|1993|76.1|21.9|23.3|17.9|215.1
Chevrolet|Sonoma Club Cab/Long Bed|1994-2005|78.7|29.5|20.6|21.3|228.9
Chevrolet|Sonoma Regular Cab/Long Bed|1993|78.9|21.9|23.3|12.8|215.7
Chevrolet|Sonoma Regular Cab/Long Bed|1994-2005|80.0|29.5|20.6|15.6|225.7
Chevrolet|Sonoma Regular Cab/Short Bed|1993|70.5|21.9|23.3|12.8|199.1
Chevrolet|Sonoma Regular Cab/Short Bed|1994-2005|74.2|29.5|20.6|15.6|214.0
Chevrolet|Spark|2013-2020|56.9|25.7|14.5|22.7|171.0
Chevrolet|Suburban 1500|2007-2014|100.9|36.0|24.1|57.7|315.2
Chevrolet|Suburban 1500|2000-2006|92.3|33.8|22.0|51.2|291.0
Chevrolet|Suburban 2500|2000-2006|92.3|33.8|22.0|51.2|291.0
Chevrolet|Suburban|2015-2020|99.7|33.7|24.8|55.9|311.3
Chevrolet|Suburban|1993-1999|99.9|31.9|24.9|54.0|302.3
Chevrolet|Tahoe|1995-1999|78.8|27.9|25.4|42.6|253.7
Chevrolet|Tahoe|2000-2006|86.9|33.9|22.0|48.7|283.2
Chevrolet|Tahoe|2007-2014|92.4|35.9|24.3|53.8|299.8
Chevrolet|Tahoe|2015-2020|87.7|33.2|24.6|51.5|288.2
Chevrolet|Tracker|1999-2004|70.4|26.9|17.7|30.5|212.0
Chevrolet|Trailblazer|2002-2008|82.3|30.0|21.0|40.6|249.9
Chevrolet|Trailblazer EXT|2002-2008|89.9|30.1|21.0|48.4|271.4
Chevrolet|Traverse|2009-2017|80.4|27.2|21.1|45.8|254.1
Chevrolet|Traverse|2018-2020|81.6|29.9|22.4|49.7|264.5
Chevrolet|Trax|2013-2020|67.9|28.4|15.5|25.2|200.0
Chevrolet|Uplander|2005-2009|92.9|30.4|18.0|43.9|268.6
Chevrolet|Venture|1997-2005|84.9|30.6|18.5|44.5|261.8
Chevrolet|Volt|2011-2020|68.0|24.8|22.5|27.9|210.8
Chrysler|200|2011-2014|70.9|25.5|23.9|22.9|220.3
Chrysler|200|2015-2017|73.6|26.3|25.9|26.6|230.1
Chrysler|300|2005-2010|77.0|26.5|25.7|24.9|231.0
Chrysler|300|2011-2020|79.5|27.0|24.9|26.9|237.8
Chrysler|Aspen|2007-2009|88.5|32.6|24.7|45.9|280.2
Chrysler|Cirrus|1995-2000|69.0|25.0|22.7|21.7|206.7
Chrysler|Concorde|1998-2004|81.7|27.4|27.9|26.8|243.0
Chrysler|Crossfire|2004-2008|51.7|20.2|22.6|13.9|164.4
Chrysler|Grand Voyager|2000-2004|90.0|32.7|19.0|47.9|277.2
Chrysler|Intrepid|1998-2004|81.1|26.9|28.2|26.9|242.9
Chrysler|LHS|1999-2001|82.4|28.4|24.7|24.9|238.9
Chrysler|Neon 4-Door|2000-2005|64.9|26.8|22.2|19.9|197.0
Chrysler|Pacifica|2004-2008|86.6|31.8|21.4|47.2|269.6
Chrysler|Pacifica|2017-2020|90.2|32.3|19.4|48.9|278.6
Chrysler|PT Cruiser|2001-2010|66.6|28.0|18.1|34.9|213.2
Chrysler|Sebring 2-Door|2001-2006|72.5|27.9|26.7|20.5|221.0
Chrysler|Sebring 4-Door|2001-2006|72.9|26.7|25.4|22.6|223.0
Chrysler|Sebring 4-Door|2007-2010|71.5|26.4|24.6|24.8|222.3
Chrysler|Sebring Convertible|2001-2006|72.5|27.9|26.7|0|201.4
Chrysler|Town & Country|1996-2000|85.7|29.7|18.5|44.7|263.9
Chrysler|Town & Country|2001-2007|88.7|31.0|18.7|47.9|273.4
Chrysler|Town & Country|2008-2016|90.8|31.8|18.0|47.9|276.3
Dodge|Avenger|2008-2014|72.9|26.4|24.9|24.1|223.8
Dodge|Caliber|2006-2012|68.6|27.9|17.1|32.9|212.2
Dodge|Caravan / Grand Caravan|1996-2000|85.7|29.7|18.5|44.7|263.9
Dodge|Caravan / Grand Caravan|2001-2007|88.7|31.0|18.7|47.9|273.4
Dodge|Caravan / Grand Caravan|2008-2020|90.8|31.8|18.0|47.9|276.3
Dodge|Challenger|2008-2020|76.8|26.7|29.0|24.5|233.4
Dodge|Charger|2006-2010|77.8|26.5|25.1|25.9|232.7
Dodge|Charger|2011-2020|79.9|27.1|25.1|27.3|239.0
Dodge|Dakota Club Cab|1993-1996|77.9|27.6|21.3|22.8|223.9
Dodge|Dakota Club Cab|1997-2004|80.9|29.7|23.1|24.7|233.8
Dodge|Dakota Club Cab|2005-2011|87.7|30.5|23.9|27.5|252.9
Dodge|Dakota Quad Cab|2005-2011|91.3|30.7|24.0|29.9|263.5
Dodge|Dakota Regular Cab|1993-1996|71.7|27.6|21.3|15.4|199.8
Dodge|Dakota Regular Cab|1997-2004|75.7|29.7|23.1|16.3|217.8
Dodge|Dart|2013-2016|73.4|26.1|24.2|23.5|223.0
Dodge|Durango|1998-2003|85.1|33.7|22.9|45.3|273.3
Dodge|Durango|2004-2009|88.5|32.6|24.7|45.9|280.2
Dodge|Durango|2011-2020|87.2|31.2|23.0|45.2|274.0
Dodge|Grand Caravan - Cargo|2012-2020|90.8|31.8|18.0|47.9|276.3
Dodge|Intrepid|1998-2004|81.1|26.9|28.2|26.9|242.9
Dodge|Journey|2009-2020|81.0|29.7|21.0|39.2|252.1
Dodge|Magnum|2005-2008|79.9|26.3|25.3|34.1|248.3
Dodge|Neon 4-Door|2000-2005|64.9|26.8|22.2|19.9|197.0
Dodge|Nitro|2007-2011|76.7|29.1|20.7|36.5|240.9
Dodge|Ram 1500 – Crew Cab|2002-2008|104.7|33.3|29.7|32.6|306.4
Dodge|Ram 1500 – Crew Cab|2009-2018|100.2|34.7|28.0|33.9|302.7
Dodge|Ram 1500 – Crew Cab - 5'7 box|2019-2020|118.1|38.7|32.9|36.4|339.2
Dodge|Ram 1500 – Crew Cab - 6'4 box|2019-2020|124.9|38.7|32.9|36.4|349.0
Dodge|Ram 1500 – Crew Cab Short Box|2002-2008|99.7|33.3|29.7|32.6|295.3
Dodge|Ram 1500 – Mega Cab|2006-2008|113.2|33.9|29.8|37.4|327.5
Dodge|Ram 1500 – Quad Cab|2002-2008|96.0|33.5|29.7|29.6|288.7
Dodge|Ram 1500 – Quad Cab|2009-2018|96.1|34.7|28.0|30.0|290.6
Dodge|Ram 1500 – Quad Cab - 6'4 box|2019-2020|115.9|38.5|32.9|30.9|326.5
Dodge|Ram 1500 – Reg Cab Long Box|2002-2008|94.1|33.3|29.7|18.7|281.5
Dodge|Ram 1500 – Reg Cab Long Box|2009-2018|89.9|34.6|28.0|19.9|272.8
Dodge|Ram 1500 – Reg Cab Short Box|2002-2008|86.4|33.1|29.7|18.7|262.0
Dodge|Ram 1500 – Reg Cab Short Box|2009-2018|82.7|34.6|28.0|19.9|258.4
Dodge|Ram 2500 - Crew Cab - 6'4 box|2019-2020|116.5|38.0|34.5|35.1|330.3
Dodge|Ram 2500 - Crew Cab - 8' box|2019-2020|130.9|38.0|34.5|35.1|350.3
Dodge|Ram 2500 - Mega Cab - 6'4 box|2019-2020|122.6|38.0|34.5|38.5|343.3
Dodge|Ram 2500 – Crew Cab|2003-2009|102.5|33.3|29.7|34.9|306.7
Dodge|Ram 2500 – Crew Cab|2010-2018|101.1|34.8|30.2|34.5|306.9
Dodge|Ram 2500 – Mega Cab|2006-2009|113.2|33.9|29.8|37.4|327.5
Dodge|Ram 2500 – Quad Cab|2003-2009|96.0|33.5|29.7|29.6|288.7
Dodge|Ram 2500 – Quad Cab|2010-2018|95.9|34.8|30.2|29.5|293.3
Dodge|Ram 2500 – Reg Cab|2003-2009|86.4|33.1|29.7|18.7|262.0
Dodge|Ram 2500 – Reg Cab|2010-2018|82.6|34.7|30.2|19.7|260.4
Dodge|Ram 3500 - Crew Cab - 6'4 box|2019-2020|116.5|38.0|34.5|35.1|330.3
Dodge|Ram 3500 - Crew Cab - 8' box|2019-2020|130.9|38.0|34.5|35.1|350.3
Dodge|Ram 3500 - Mega Cab - 6'4 box|2019-2020|122.6|38.0|34.5|38.5|343.3
Dodge|Ram 3500 – Crew Cab|2003-2009|102.5|33.3|29.7|34.9|306.7
Dodge|Ram 3500 – Crew Cab|2010-2018|101.1|34.8|30.2|34.5|306.9
Dodge|Ram 3500 – Mega Cab|2006-2009|113.2|33.9|29.8|37.4|327.5
Dodge|Ram 3500 – Quad Cab|2003-2009|96.0|33.5|29.7|29.6|288.7
Dodge|Ram 3500 – Quad Cab|2010-2018|95.9|34.8|30.2|29.5|293.3
Dodge|Ram 3500 – Reg Cab|2003-2009|86.4|33.1|29.7|18.7|262.0
Dodge|Ram 3500 – Reg Cab|2010-2018|82.6|34.7|30.2|19.7|260.4
Dodge|Ram Promaster 1500 – 118"|2013-2020|95.7|47.4|22.9|54.7|332.3
Dodge|Ram Promaster 1500 – 136"|2013-2020|104.0|48.9|22.9|54.7|352.0
Dodge|Ram Promaster 2500 – 136"|2013-2020|104.0|48.9|22.9|60.2|363.2
Dodge|Ram Promaster 2500 – 159"|2013-2020|116.3|50.9|22.9|60.2|387.9
Dodge|Ram Promaster 3500 – 159"|2013-2020|116.3|50.9|22.9|60.2|387.9
Dodge|Ram Promaster City – Cargo|2015-2020|79.9|29.9|18.6|38.5|248.5
Dodge|Ram Promaster City – Wagon|2015-2020|79.9|29.9|18.6|38.5|248.5
Dodge|Ram Van – 109" WB|1993-2003|86.1|36.7|16.9|61.2|288.9
Dodge|Ram Van – 127" WB|1993-2003|96.7|38.3|16.9|70.9|322.3
Dodge|Ram Van – 127" WB Maxi Wagon|1993-2003|96.7|38.3|16.9|70.9|322.3
Dodge|Sprinter Van – 118" WB|2002-2006|88.6|46.7|16.1|50.9|290.6
Dodge|Sprinter Van – 140" WB|2002-2006|100.2|48.3|16.1|56.5|318.7
Dodge|Sprinter Van – 140" WB – High Roof|2002-2006|100.2|48.3|16.1|56.5|318.7
Dodge|Sprinter Van – 158" WB|2002-2006|109.4|49.5|16.1|61.5|340.7
Dodge|Sprinter Van – 158" WB – High Roof|2002-2006|109.4|49.5|16.1|61.5|340.7
Dodge|Stratus 4-Door|1995-2000|69.0|25.0|22.7|21.7|206.7
Dodge|Stratus 4-Door|2001-2006|72.9|26.7|25.4|22.6|223.0
Dodge|Viper|2003-2010|59.6|21.2|31.6|0|176.0
Fiat|124 Spider|2017-2020|50.9|21.1|18.0|0|140.9
Fiat|500|2012-2020|54.5|24.1|13.5|20.1|169.8
Fiat|500L|2014-2020|66.9|26.8|16.3|29.0|201.9
Fiat|500X|2016-2020|68.9|27.5|17.1|29.1|210.0
Ford|Bronco Sport|2021-2023|75.0|29.5|19.3|35.9|229.2
Ford|C-Max|2012-2018|67.5|27.9|17.4|34.2|214.5
Ford|Contour|1995-2000|65.5|25.5|21.5|21.5|200.0
Ford|Crown Victoria|1998-2011|81.2|28.0|27.1|26.9|241.0
Ford|E-Series - Long - Panel|1992-2007|107.2|39.9|11.8|81.3|352.0
Ford|E-Series - Long - Window|1992-2007|107.2|39.9|11.8|81.3|352.0
Ford|E-Series - Medium - Panel|1992-2007|92.1|39.3|11.8|68.5|311.2
Ford|E-Series - Medium - Window|1992-2007|92.1|39.3|11.8|68.5|311.2
Ford|E-Series - Short - Panel|1992-2007|79.7|37.1|11.8|56.6|276.4
Ford|E-Series - Short - Window|1992-2007|79.7|37.1|11.8|56.6|276.4
Ford|E-Series – 138" WB – Panel|2008-2020|107.9|38.0|15.7|74.2|341.6
Ford|E-Series – 138" WB – Window|2008-2020|107.9|38.0|15.7|74.2|341.6
Ford|E-Series – 158" WB – Panel|2008-2020|117.7|39.2|15.7|83.9|371.3
Ford|E-Series – 158" WB – Window|2008-2020|117.7|39.2|15.7|83.9|371.3
Ford|E-Series – 176" WB – Panel|2008-2020|127.5|39.9|15.7|93.5|399.4
Ford|E-Series – 176" WB – Window|2008-2020|127.5|39.9|15.7|93.5|399.4
Ford|E-Series Cutaway – 138" WB|2008-2020|91.3|36.7|15.7|0|252.4
Ford|E-Series Cutaway – 158" WB|2008-2020|101.1|37.9|15.7|0|272.7
Ford|E-Series Cutaway – 176" WB|2008-2020|110.9|38.6|15.7|0|292.0
Ford|EcoSport|2018-2022|65.7|27.9|16.1|28.1|204.6
Ford|Edge|2007-2014|80.1|29.4|22.5|40.1|250.7
Ford|Edge|2015-2020|81.2|29.5|22.8|40.9|253.6
Ford|Escape|2001-2007|74.0|28.9|18.9|35.5|225.0
Ford|Escape|2008-2012|74.2|28.5|19.4|35.9|225.9
Ford|Escape|2013-2019|77.5|28.5|20.1|36.7|233.2
Ford|Escape|2020-2023|78.4|29.5|19.5|37.9|237.4
Ford|Escort Sedan|1997-2002|63.7|26.2|19.5|20.7|196.3
Ford|Escort Wagon|1997-2002|62.9|26.2|19.5|27.7|203.2
Ford|Excursion|2000-2005|113.2|38.3|24.9|60.8|350.5
Ford|Expedition|1997-2002|88.9|32.9|22.1|47.7|281.5
Ford|Expedition|2003-2006|93.1|33.9|22.9|50.9|291.9
Ford|Expedition|2007-2017|92.2|33.5|24.0|50.2|290.1
Ford|Expedition|2018-2020|96.5|34.3|25.1|53.6|305.1
Ford|Expedition EL/MAX|2007-2017|100.7|33.5|24.0|58.7|310.9
Ford|Expedition Max|2018-2020|105.0|34.3|25.1|62.1|326.0
Ford|Explorer|1995-2001|81.9|29.9|21.5|42.9|259.1
Ford|Explorer|2002-2005|84.1|30.5|21.9|44.5|267.1
Ford|Explorer|2006-2010|85.1|31.0|22.0|44.9|270.0
Ford|Explorer|2011-2019|82.5|29.5|22.3|44.1|259.2
Ford|Explorer|2020-2023|84.7|30.0|23.0|45.5|266.9
Ford|Explorer Sport Trac|2001-2005|83.9|30.5|21.9|28.9|241.8
Ford|Explorer Sport Trac|2007-2010|87.9|30.9|23.9|28.9|251.5
Ford|F-150 – Crew Cab – 5.5ft box|2004-2008|99.5|34.5|29.9|32.9|296.9
Ford|F-150 – Crew Cab – 5.5ft box|2009-2014|99.5|35.0|30.5|33.5|301.2
Ford|F-150 – Crew Cab – 5.5ft box|2015-2020|101.0|35.2|30.5|34.0|305.2
Ford|F-150 – Crew Cab – 6.5ft box|2004-2008|106.9|34.5|29.9|32.9|312.5
Ford|F-150 – Crew Cab – 6.5ft box|2009-2014|106.9|35.0|30.5|33.5|316.8
Ford|F-150 – Crew Cab – 6.5ft box|2015-2020|108.4|35.2|30.5|34.0|320.8
Ford|F-150 – Crew Cab – 8ft box|2015-2020|122.7|35.3|30.5|34.0|342.0
Ford|F-150 – Ext Cab – 6.5ft box|2004-2008|98.5|34.5|29.9|28.9|286.0
Ford|F-150 – Ext Cab – 6.5ft box|2009-2014|98.5|35.0|30.5|29.5|290.1
Ford|F-150 – Ext Cab – 6.5ft box|2015-2020|100.0|35.2|30.5|30.0|294.2
Ford|F-150 – Ext Cab – 8ft box|2004-2008|108.9|34.5|29.9|28.9|306.5
Ford|F-150 – Ext Cab – 8ft box|2009-2014|108.9|35.0|30.5|29.5|310.5
Ford|F-150 – Ext Cab – 8ft box|2015-2020|114.3|35.3|30.5|30.0|318.5
Ford|F-150 – Lightning|2022-2023|102.1|35.6|30.9|34.5|308.9
Ford|F-150 – Regular Cab – 6.5ft box|2004-2008|82.9|34.5|29.9|18.5|259.0
Ford|F-150 – Regular Cab – 6.5ft box|2009-2014|82.9|35.0|30.5|19.1|262.9
Ford|F-150 – Regular Cab – 8ft box|2004-2008|93.3|34.5|29.9|18.5|279.5
Ford|F-150 – Regular Cab – 8ft box|2009-2014|93.3|35.0|30.5|19.1|283.3
Ford|F-150 – Regular Cab – 8ft box|2015-2020|97.5|35.2|30.5|19.5|291.3
Ford|F-150 Supercrew – 5.5ft box|1997-2003|93.7|32.9|28.5|31.1|281.2
Ford|F-150 Supercrew – 6.5ft box|1997-2003|101.1|32.9|28.5|31.1|296.8
Ford|F-250 – Crew Cab – 6.75ft box|2017-2020|108.3|36.6|32.9|34.5|320.7
Ford|F-250 – Crew Cab – 8ft box|2017-2020|120.9|36.6|32.9|34.5|340.5
Ford|F-250 – Regular Cab – 8ft box|2017-2020|94.5|36.5|32.9|19.9|286.5
Ford|F-250 – Supercab – 6.75ft box|2017-2020|102.7|36.5|32.9|29.9|305.6
Ford|F-250 – Supercab – 8ft box|2017-2020|114.9|36.6|32.9|29.9|325.1
Ford|F-250 Super Duty – Crew Cab|2000-2007|102.1|33.9|28.9|34.2|306.2
Ford|F-250 Super Duty – Crew Cab|2008-2016|102.5|35.5|30.5|34.5|310.9
Ford|F-250 Super Duty – Ext Cab|2000-2007|96.0|33.9|28.9|29.0|288.0
Ford|F-250 Super Duty – Ext Cab|2008-2016|96.4|35.5|30.5|29.5|292.5
Ford|F-250 Super Duty – Regular Cab|2000-2007|85.5|33.5|28.9|18.7|265.8
Ford|F-250 Super Duty – Regular Cab|2008-2016|85.9|35.5|30.5|19.1|269.5
Ford|F-350 – Crew Cab – 6.75ft box|2017-2020|108.3|36.6|32.9|34.5|320.7
Ford|F-350 – Crew Cab – 8ft box|2017-2020|120.9|36.6|32.9|34.5|340.5
Ford|F-350 – Regular Cab – 8ft box|2017-2020|94.5|36.5|32.9|19.9|286.5
Ford|F-350 – Supercab – 8ft box|2017-2020|114.9|36.6|32.9|29.9|325.1
Ford|F-350 Super Duty – Crew Cab|2000-2007|102.1|33.9|28.9|34.2|306.2
Ford|F-350 Super Duty – Crew Cab|2008-2016|102.5|35.5|30.5|34.5|310.9
Ford|F-350 Super Duty – Ext Cab|2000-2007|96.0|33.9|28.9|29.0|288.0
Ford|F-350 Super Duty – Ext Cab|2008-2016|96.4|35.5|30.5|29.5|292.5
Ford|F-350 Super Duty – Regular Cab|2000-2007|85.5|33.5|28.9|18.7|265.8
Ford|F-350 Super Duty – Regular Cab|2008-2016|85.9|35.5|30.5|19.1|269.5
Ford|F-450 – Crew Cab|2017-2020|124.0|37.5|34.9|35.9|353.5
Ford|F-450 Super Duty – Crew Cab|2008-2016|106.5|36.5|32.5|35.5|323.5
Ford|Fiesta 4-Door|2011-2019|58.2|24.5|14.9|18.9|181.7
Ford|Fiesta 5-Door|2011-2019|57.2|24.5|14.9|21.9|181.7
Ford|Five Hundred|2005-2007|77.9|27.9|24.5|28.9|238.7
Ford|Flex|2009-2019|88.9|29.1|21.5|48.2|270.2
Ford|Focus 4-Door|2000-2007|65.9|26.1|19.9|22.7|201.5
Ford|Focus 4-Door|2008-2011|66.7|26.1|20.5|22.9|204.5
Ford|Focus 4-Door|2012-2018|68.3|26.5|21.5|24.5|212.1
Ford|Focus 5-Door|2000-2007|62.5|26.1|19.9|26.9|201.2
Ford|Focus 5-Door|2012-2018|65.9|26.5|21.5|29.1|211.3
Ford|Focus RS|2016-2018|68.9|26.9|21.9|25.5|216.5
Ford|Focus ST|2013-2018|68.9|26.9|21.9|25.5|216.5
Ford|Freestar|2004-2007|91.9|31.9|18.9|46.9|277.5
Ford|Freestyle|2005-2007|83.5|29.9|21.5|41.9|258.5
Ford|Fusion|2006-2012|72.5|26.5|23.9|24.9|223.5
Ford|Fusion|2013-2020|74.5|26.9|24.5|26.5|229.9
Ford|GT|2005-2006|61.9|21.5|29.9|14.5|183.5
Ford|Maverick|2022-2023|79.9|28.5|21.5|26.9|228.5
Ford|Mustang|1994-2004|68.9|26.5|25.9|18.5|206.9
Ford|Mustang|2005-2009|70.5|26.9|26.5|19.5|213.0
Ford|Mustang|2010-2014|71.5|26.9|26.9|19.9|216.0
Ford|Mustang|2015-2020|73.5|27.3|27.5|20.5|222.5
Ford|Mustang Convertible|1994-2004|68.9|26.5|25.9|0|187.2
Ford|Mustang Convertible|2005-2009|70.5|26.9|26.5|0|193.5
Ford|Mustang Convertible|2010-2014|71.5|26.9|26.9|0|196.1
Ford|Mustang Convertible|2015-2020|73.5|27.3|27.5|0|202.0
Ford|Mustang Mach-E|2021-2023|79.2|29.1|21.9|37.9|243.9
Ford|Ranger – Crew Cab|2019-2023|88.5|31.5|24.5|29.5|261.5
Ford|Ranger – Ext Cab|2019-2023|82.9|31.5|24.5|23.9|248.5
Ford|Ranger Ext Cab|1993-2011|71.9|27.9|20.5|22.5|215.5
Ford|Ranger Regular Cab|1993-2011|66.9|27.9|20.5|14.5|196.5
Ford|Taurus|1996-2007|77.5|27.5|25.5|25.5|230.5
Ford|Taurus|2008-2009|78.9|27.9|25.9|26.9|236.1
Ford|Taurus|2010-2019|80.5|28.5|26.5|28.5|243.5
Ford|Thunderbird|2002-2005|62.5|23.5|24.5|0|174.0
Ford|Transit – 130" WB – Low Roof|2015-2020|95.5|39.9|19.5|58.9|305.5
Ford|Transit – 130" WB – Medium Roof|2015-2020|95.5|45.5|19.5|58.9|317.2
Ford|Transit – 148" WB – High Roof|2015-2020|109.9|52.5|19.5|68.9|366.7
Ford|Transit – 148" WB – Low Roof|2015-2020|105.5|39.9|19.5|68.9|339.5
Ford|Transit – 148" WB – Medium Roof|2015-2020|105.5|45.5|19.5|68.9|351.2
Ford|Transit – 148" WB – Extended – High Roof|2015-2020|118.5|52.5|19.5|78.5|393.0
Ford|Transit Connect Cargo – LWB|2014-2020|78.5|29.5|17.5|39.5|248.0
Ford|Transit Connect Cargo – SWB|2014-2020|71.9|29.5|17.5|32.9|232.7
Ford|Transit Connect Passenger – LWB|2014-2020|78.5|29.5|17.5|39.5|248.0
Ford|Transit Connect Wagon|2010-2013|70.5|29.5|17.5|35.5|234.5
Ford|Windstar|1995-1998|82.5|30.5|17.9|44.5|261.5
Ford|Windstar|1999-2003|87.5|31.5|18.5|46.9|272.9
Freightliner|Sprinter 2500 – 144"|2007-2020|99.9|46.9|17.5|56.5|318.5
Freightliner|Sprinter 2500 – 170"|2007-2020|112.5|48.5|17.5|66.5|351.5
Freightliner|Sprinter 2500 – 170" Ext|2007-2020|125.5|49.9|17.5|76.5|386.5
Freightliner|Sprinter 3500 – 144"|2007-2020|99.9|46.9|17.5|56.5|318.5
Freightliner|Sprinter 3500 – 170"|2007-2020|112.5|48.5|17.5|66.5|351.5
Freightliner|Sprinter 3500 – 170" Ext|2007-2020|125.5|49.9|17.5|76.5|386.5
Genesis|G70|2019-2023|71.5|26.5|24.5|22.5|218.5
Genesis|G80|2017-2023|78.5|27.9|25.5|27.5|238.9
Genesis|G90|2017-2023|85.5|29.5|27.5|32.5|261.5
Genesis|GV70|2022-2023|76.5|29.5|21.9|35.5|241.9
Genesis|GV80|2021-2023|84.5|31.5|23.5|42.5|265.5
GMC|Acadia|2007-2016|83.5|28.9|21.5|44.9|260.5
GMC|Acadia|2017-2020|80.5|29.5|21.9|42.5|253.9
GMC|Canyon – Crew Cab|2004-2012|84.5|26.5|19.5|27.5|241.5
GMC|Canyon – Crew Cab|2015-2020|91.5|31.9|25.5|29.9|268.9
GMC|Canyon – Ext Cab|2004-2012|82.5|26.5|19.5|16.5|225.5
GMC|Canyon – Ext Cab|2015-2020|87.5|31.9|25.5|23.5|253.9
GMC|Denali – Crew Cab|2007-2013|111.5|36.5|27.5|37.5|321.5
GMC|Envoy|2002-2009|82.5|30.5|21.5|41.5|251.5
GMC|Envoy XL|2002-2009|90.5|30.5|21.5|49.5|275.5
GMC|Jimmy|1995-2001|71.5|29.5|23.5|38.5|233.5
GMC|Safari|1993-2005|86.5|34.5|15.5|54.5|277.5
GMC|Savana – 135" WB – Panel|1997-2020|107.5|36.9|15.5|75.5|342.5
GMC|Savana – 135" WB – Window|1997-2020|107.5|36.9|15.5|75.5|342.5
GMC|Savana – 155" WB – Panel|1997-2020|123.5|37.5|15.5|82.5|380.5
GMC|Savana – 155" WB – Window|1997-2020|123.5|37.5|15.5|82.5|380.5
GMC|Sierra 1500 – Crew Cab|1999-2006|107.5|27.5|23.5|35.5|300.5
GMC|Sierra 1500 – Crew Cab|2007-2013|111.5|35.5|27.5|36.9|320.5
GMC|Sierra 1500 – Crew Cab – 5.8ft box|2014-2018|96.9|35.5|31.5|36.5|296.0
GMC|Sierra 1500 – Crew Cab – 5.8ft box|2019-2020|113.5|37.0|32.0|33.9|328.9
GMC|Sierra 1500 – Crew Cab – 6.6ft box|2014-2018|101.5|35.5|31.5|36.5|304.6
GMC|Sierra 1500 – Crew Cab – 6.6ft box|2019-2020|118.5|37.0|32.0|33.9|338.9
GMC|Sierra 1500 – Double Cab – 6.6ft box|2014-2018|96.5|35.5|31.5|31.5|283.6
GMC|Sierra 1500 – Double Cab – 6.6ft box|2019-2020|114.0|37.0|32.0|30.0|325.5
GMC|Sierra 1500 – Ext Cab|1999-2006|98.5|27.5|23.5|32.5|280.5
GMC|Sierra 1500 – Ext Cab|2007-2013|98.5|35.5|27.5|32.9|290.5
GMC|Sierra 1500 – Regular Cab|1999-2006|88.5|27.5|23.5|18.5|251.5
GMC|Sierra 1500 – Regular Cab|2007-2013|87.5|35.5|27.5|21.5|257.5
GMC|Sierra 1500 – Regular Cab – 8ft box|2014-2018|95.5|35.5|31.5|19.5|276.5
GMC|Sierra 1500 – Regular Cab – 8ft box|2019-2020|112.9|36.9|32.0|21.5|315.0
GMC|Sierra 2500 – Crew Cab – 6.6ft box|2019-2020|116.9|38.0|34.9|35.5|331.0
GMC|Sierra 2500 – Crew Cab – 8ft box|2019-2020|131.5|38.0|34.9|35.5|351.0
GMC|Sierra 2500 HD – Crew Cab|2001-2007|102.5|27.5|23.5|35.5|298.5
GMC|Sierra 2500 HD – Crew Cab|2008-2013|111.5|35.9|27.9|36.5|319.9
GMC|Sierra 2500 HD – Crew Cab|2014-2018|103.5|36.5|32.5|35.5|313.5
GMC|Sierra 2500 HD – Ext Cab|2001-2007|96.5|27.5|23.5|32.5|281.5
GMC|Sierra 2500 HD – Ext Cab|2008-2013|98.5|35.9|27.9|32.5|295.9
GMC|Sierra 2500 HD – Regular Cab|2001-2007|87.5|27.5|23.5|18.5|257.5
GMC|Sierra 2500 HD – Regular Cab|2008-2013|88.5|35.9|27.9|21.5|265.9
GMC|Sierra 3500 – Crew Cab – 6.6ft box|2019-2020|116.9|38.0|34.9|35.5|331.0
GMC|Sierra 3500 – Crew Cab – 8ft box|2019-2020|131.5|38.0|34.9|35.5|351.0
GMC|Sierra 3500 HD – Crew Cab|2001-2007|102.5|27.5|23.5|35.5|298.5
GMC|Sierra 3500 HD – Crew Cab|2008-2013|111.5|35.9|27.9|36.5|319.9
GMC|Sierra 3500 HD – Crew Cab|2014-2018|103.5|36.5|32.5|35.5|313.5
GMC|Sierra 3500 HD – Ext Cab|2001-2007|96.5|27.5|23.5|32.5|281.5
GMC|Sierra 3500 HD – Ext Cab|2008-2013|98.5|35.9|27.9|32.5|295.9
GMC|Sierra 3500 HD – Regular Cab|2001-2007|87.5|27.5|23.5|18.5|257.5
GMC|Sierra 3500 HD – Regular Cab|2008-2013|88.5|35.9|27.9|21.5|265.9
GMC|Sonoma – Ext Cab|1994-2004|79.5|29.9|21.0|21.5|229.5
GMC|Sonoma – Regular Cab|1994-2004|80.5|29.9|21.0|16.0|226.0
GMC|Suburban|1993-1999|100.5|32.5|25.5|54.5|303.5
GMC|Suburban|2015-2020|100.5|34.0|25.0|56.5|312.5
GMC|Terrain|2010-2017|74.5|28.5|21.5|34.5|230.5
GMC|Terrain|2018-2020|77.5|29.5|22.5|36.5|241.5
GMC|Yukon|1995-1999|79.5|28.5|25.5|43.5|254.5
GMC|Yukon|2000-2006|87.5|34.5|22.5|49.5|284.5
GMC|Yukon|2007-2014|92.9|36.5|24.5|54.5|300.5
GMC|Yukon|2015-2020|88.5|33.5|25.0|52.0|289.0
GMC|Yukon XL|2000-2006|92.9|34.5|22.5|51.9|291.9
GMC|Yukon XL|2007-2014|101.5|36.5|24.5|58.5|316.0
GMC|Yukon XL|2015-2020|100.5|34.0|25.0|56.5|312.5
Honda|Accord 2-Door|1998-2002|69.5|25.5|22.5|19.5|203.5
Honda|Accord 2-Door|2003-2007|71.5|25.9|23.5|20.5|210.5
Honda|Accord 2-Door|2008-2012|73.5|26.5|24.5|21.5|218.5
Honda|Accord 2-Door|2013-2017|74.5|26.9|25.5|22.5|223.9
Honda|Accord 4-Door|1998-2002|70.5|26.5|22.5|22.5|209.5
Honda|Accord 4-Door|2003-2007|72.5|26.9|23.5|24.5|218.5
Honda|Accord 4-Door|2008-2012|74.5|27.5|24.5|26.5|227.5
Honda|Accord 4-Door|2013-2017|75.5|27.9|25.5|27.5|232.9
Honda|Accord 4-Door|2018-2020|76.9|27.9|26.5|28.5|237.5
Honda|Civic 2-Door|1996-2000|62.5|24.5|19.5|17.5|184.5
Honda|Civic 2-Door|2001-2005|64.5|25.0|20.5|18.5|192.5
Honda|Civic 2-Door|2006-2011|66.5|25.5|21.5|19.5|200.5
Honda|Civic 2-Door|2012-2015|68.5|26.0|22.5|20.5|208.5
Honda|Civic 2-Door|2016-2020|70.5|26.5|23.5|21.5|216.5
Honda|Civic 4-Door|1996-2000|63.5|25.5|19.5|20.5|189.5
Honda|Civic 4-Door|2001-2005|65.5|26.0|20.5|22.5|198.5
Honda|Civic 4-Door|2006-2011|67.5|26.5|21.5|24.5|207.5
Honda|Civic 4-Door|2012-2015|69.5|27.0|22.5|25.5|215.5
Honda|Civic 4-Door|2016-2020|71.5|27.5|23.5|27.5|223.5
Honda|Civic 5-Door|2017-2020|68.5|27.0|23.5|30.5|221.0
Honda|Civic Type R|2017-2020|70.5|27.5|24.5|29.5|225.5
Honda|Clarity|2017-2021|74.5|27.5|24.5|28.5|229.5
Honda|CR-V|1997-2001|70.5|28.5|18.5|33.5|220.5
Honda|CR-V|2002-2006|72.5|28.9|19.5|35.5|228.9
Honda|CR-V|2007-2011|74.5|29.5|20.5|37.5|237.5
Honda|CR-V|2012-2016|76.5|29.9|21.5|39.5|246.9
Honda|CR-V|2017-2020|78.5|30.5|22.5|41.5|255.5
Honda|CR-Z|2011-2016|62.5|24.5|20.5|18.5|190.5
Honda|Element|2003-2011|73.5|29.5|18.5|35.5|229.5
Honda|Fit|2007-2014|61.5|26.5|16.5|26.5|197.5
Honda|Fit|2015-2020|63.5|27.0|17.5|28.5|205.0
Honda|HR-V|2016-2020|68.5|28.5|18.5|32.5|216.5
Honda|Insight|2010-2014|64.5|26.5|21.5|24.5|203.5
Honda|Insight|2019-2020|70.5|27.0|23.5|26.5|218.0
Honda|Odyssey|1999-2004|84.5|30.5|18.5|45.5|266.5
Honda|Odyssey|2005-2010|87.5|31.5|19.5|48.5|278.5
Honda|Odyssey|2011-2017|90.5|32.5|20.5|50.5|290.5
Honda|Odyssey|2018-2020|92.5|33.0|21.5|52.5|299.0
Honda|Passport|2019-2020|80.5|30.5|22.5|42.5|256.5
Honda|Pilot|2003-2008|81.5|31.5|21.5|43.5|261.5
Honda|Pilot|2009-2015|84.5|32.5|22.5|46.5|273.5
Honda|Pilot|2016-2020|86.5|33.0|23.5|48.5|283.0
Honda|Prelude|1997-2001|66.5|25.5|23.5|17.5|200.5
Honda|Ridgeline|2006-2014|89.5|30.5|23.5|29.5|259.5
Honda|Ridgeline|2017-2020|91.5|31.0|24.5|31.5|267.0
Honda|S2000|1999-2009|55.5|22.5|21.5|0|163.0
Hummer|H2|2003-2009|96.5|36.5|25.5|49.5|295.5
Hummer|H3|2006-2010|77.5|29.5|21.5|36.5|241.5
Hyundai|Accent 4-Door|2006-2011|62.5|25.5|18.5|20.5|191.5
Hyundai|Accent 4-Door|2012-2017|64.5|26.0|19.5|22.5|200.0
Hyundai|Accent 4-Door|2018-2020|66.5|26.5|20.5|24.5|208.5
Hyundai|Azera|2006-2011|76.5|27.5|25.5|26.5|232.5
Hyundai|Azera|2012-2017|78.5|28.0|26.5|28.5|241.0
Hyundai|Elantra 4-Door|2001-2006|66.5|26.0|20.5|22.5|202.0
Hyundai|Elantra 4-Door|2007-2010|68.5|26.5|21.5|24.5|211.5
Hyundai|Elantra 4-Door|2011-2016|70.5|27.0|22.5|26.5|220.0
Hyundai|Elantra 4-Door|2017-2020|72.5|27.5|23.5|28.5|228.5
Hyundai|Elantra 5-Door|2013-2017|68.5|27.0|22.5|30.5|218.0
Hyundai|Elantra 5-Door|2018-2020|70.5|27.5|23.5|32.5|226.5
Hyundai|Entourage|2007-2009|88.5|32.0|19.5|48.5|280.0
Hyundai|Equus|2011-2016|82.5|29.0|27.5|30.5|248.0
Hyundai|Genesis Coupe|2010-2016|70.5|26.5|24.5|19.5|214.5
Hyundai|Genesis Sedan|2009-2014|78.5|28.0|26.5|28.5|240.0
Hyundai|Genesis Sedan|2015-2016|80.5|28.5|27.5|30.5|248.5
Hyundai|Ioniq|2017-2020|68.5|27.0|22.5|28.5|215.0
Hyundai|Ioniq 5|2022-2023|76.5|29.5|22.5|36.5|241.5
Hyundai|Kona|2018-2020|68.5|28.5|18.5|30.5|214.5
Hyundai|Kona Electric|2019-2020|68.5|28.5|18.5|30.5|214.5
Hyundai|Palisade|2020-2023|86.5|32.5|24.5|48.5|280.5
Hyundai|Santa Cruz|2022-2023|79.5|29.5|22.5|27.5|237.5
Hyundai|Santa Fe|2001-2006|76.5|29.5|20.5|38.5|243.5
Hyundai|Santa Fe|2007-2012|78.5|30.0|21.5|40.5|252.0
Hyundai|Santa Fe|2013-2018|80.5|30.5|22.5|42.5|260.5
Hyundai|Santa Fe|2019-2020|82.5|31.0|23.5|44.5|269.0
Hyundai|Santa Fe XL|2019-2020|88.5|32.0|24.5|50.5|287.0
Hyundai|Sonata|2002-2005|72.5|26.5|23.5|24.5|220.5
Hyundai|Sonata|2006-2010|74.5|27.0|24.5|26.5|229.0
Hyundai|Sonata|2011-2014|76.5|27.5|25.5|28.5|237.5
Hyundai|Sonata|2015-2019|78.5|28.0|26.5|30.5|246.0
Hyundai|Sonata|2020-2023|80.5|28.5|27.5|32.5|254.5
Hyundai|Tiburon|2003-2008|66.5|25.5|22.5|18.5|200.5
Hyundai|Tucson|2005-2009|72.5|28.5|19.5|34.5|222.5
Hyundai|Tucson|2010-2015|74.5|29.0|20.5|36.5|231.0
Hyundai|Tucson|2016-2020|76.5|29.5|21.5|38.5|239.5
Hyundai|Veloster|2012-2017|64.5|26.0|21.5|22.5|200.0
Hyundai|Veloster|2019-2020|66.5|26.5|22.5|24.5|208.5
Hyundai|Venue|2020-2023|64.5|27.5|17.5|27.5|202.5
Hyundai|Veracruz|2007-2012|83.5|31.5|23.5|46.5|269.5
Infiniti|EX35|2008-2012|74.5|28.5|21.5|34.5|230.5
Infiniti|FX35|2003-2008|78.5|29.5|22.5|38.5|242.5
Infiniti|FX35|2009-2013|80.5|30.0|23.5|40.5|251.0
Infiniti|FX45|2003-2008|78.5|29.5|22.5|38.5|242.5
Infiniti|G35 Coupe|2003-2007|70.5|26.5|24.5|19.5|214.5
Infiniti|G35 Sedan|2003-2006|72.5|27.0|25.5|24.5|223.0
Infiniti|G37 Coupe|2008-2013|72.5|27.0|25.5|20.5|220.0
Infiniti|G37 Sedan|2007-2013|74.5|27.5|26.5|26.5|229.5
Infiniti|JX35|2013|84.5|31.5|23.5|46.5|269.5
Infiniti|M35|2006-2010|76.5|27.5|26.5|26.5|233.5
Infiniti|M37|2011-2013|78.5|28.0|27.5|28.5|242.0
Infiniti|M45|2003-2010|76.5|27.5|26.5|26.5|233.5
Infiniti|Q50|2014-2020|74.5|27.5|26.5|26.5|229.5
Infiniti|Q60|2017-2020|72.5|27.0|26.5|21.5|221.0
Infiniti|Q70|2014-2019|78.5|28.0|27.5|28.5|242.0
Infiniti|QX30|2017-2019|68.5|27.5|19.5|30.5|214.5
Infiniti|QX50|2014-2017|74.5|28.5|21.5|34.5|230.5
Infiniti|QX50|2019-2020|76.5|29.5|22.5|38.5|242.5
Infiniti|QX56|2004-2010|94.5|34.5|25.5|52.5|298.5
Infiniti|QX56|2011-2013|96.5|35.0|26.5|54.5|307.0
Infiniti|QX60|2014-2020|84.5|31.5|23.5|46.5|269.5
Infiniti|QX70|2014-2017|80.5|30.0|23.5|40.5|251.0
Infiniti|QX80|2014-2020|98.5|35.5|27.5|56.5|315.5
Isuzu|Ascender|2003-2008|82.5|30.5|21.5|41.5|251.5
Isuzu|Axiom|2002-2004|76.5|29.5|21.5|38.5|243.5
Isuzu|Rodeo|1998-2004|74.5|29.5|20.5|36.5|235.5
Isuzu|Trooper|1998-2002|78.5|30.5|21.5|40.5|248.5
Isuzu|VehiCross|1999-2001|66.5|28.5|19.5|28.5|209.5
Jaguar|E-Pace|2018-2020|74.5|29.5|21.5|34.5|232.5
Jaguar|F-Pace|2017-2020|80.5|30.5|23.5|42.5|256.5
Jaguar|F-Type Convertible|2014-2020|62.5|23.5|26.5|0|176.0
Jaguar|F-Type Coupe|2014-2020|62.5|23.5|26.5|16.5|192.5
Jaguar|I-Pace|2019-2020|78.5|29.5|22.5|38.5|246.5
Jaguar|S-Type|2000-2008|74.5|27.5|26.5|26.5|229.5
Jaguar|XE|2017-2020|72.5|27.0|25.5|24.5|223.0
Jaguar|XF|2009-2015|76.5|27.5|27.5|28.5|238.5
Jaguar|XF|2016-2020|78.5|28.0|28.5|30.5|247.0
Jaguar|XJ|2004-2009|80.5|28.5|28.5|30.5|250.5
Jaguar|XJ|2010-2019|82.5|29.0|29.5|32.5|259.0
Jaguar|XK Convertible|2007-2015|68.5|25.5|27.5|0|185.0
Jaguar|XK Coupe|2007-2015|68.5|25.5|27.5|18.5|203.5
Jeep|Cherokee|1997-2001|72.5|28.5|20.5|36.5|226.5
Jeep|Cherokee|2014-2020|78.5|29.5|22.5|40.5|249.5
Jeep|Compass|2007-2010|70.5|28.5|19.5|32.5|219.5
Jeep|Compass|2011-2017|72.5|29.0|20.5|34.5|228.0
Jeep|Compass|2017-2020|74.5|29.5|21.5|36.5|236.5
Jeep|Gladiator|2020-2023|95.5|32.5|24.5|29.5|272.5
Jeep|Grand Cherokee|1999-2004|80.5|30.5|22.5|42.5|256.5
Jeep|Grand Cherokee|2005-2010|82.5|31.0|23.5|44.5|265.0
Jeep|Grand Cherokee|2011-2020|84.5|31.5|24.5|46.5|273.5
Jeep|Grand Cherokee L|2021-2023|92.5|33.0|26.5|54.5|299.0
Jeep|Grand Wagoneer|2022-2023|98.5|35.5|28.5|58.5|318.5
Jeep|Liberty|2002-2007|74.5|29.5|20.5|36.5|237.5
Jeep|Liberty|2008-2012|76.5|30.0|21.5|38.5|246.0
Jeep|Patriot|2007-2017|72.5|29.0|20.5|34.5|228.0
Jeep|Renegade|2015-2020|68.5|28.5|18.5|30.5|214.5
Jeep|Wagoneer|2022-2023|92.5|34.5|27.5|52.5|299.5
Jeep|Wrangler 2-Door|1997-2006|65.5|28.5|17.5|26.5|203.5
Jeep|Wrangler 2-Door|2007-2018|68.5|29.5|18.5|28.5|213.5
Jeep|Wrangler 2-Door|2018-2020|70.5|30.0|19.5|30.5|222.0
Jeep|Wrangler 4-Door|2007-2018|78.5|29.5|18.5|38.5|241.5
Jeep|Wrangler 4-Door|2018-2020|80.5|30.0|19.5|40.5|250.0
Kia|Borrego|2009-2011|84.5|31.5|23.5|46.5|269.5
Kia|Cadenza|2014-2020|78.5|28.0|26.5|28.5|242.0
Kia|Carnival|2022-2023|92.5|33.5|21.5|52.5|295.5
Kia|EV6|2022-2023|76.5|29.5|22.5|36.5|241.5
Kia|Forte 4-Door|2010-2013|68.5|26.5|21.5|24.5|209.5
Kia|Forte 4-Door|2014-2018|70.5|27.0|22.5|26.5|218.0
Kia|Forte 4-Door|2019-2020|72.5|27.5|23.5|28.5|226.5
Kia|Forte 5-Door|2014-2018|68.5|27.0|22.5|30.5|216.0
Kia|K5|2021-2023|76.5|27.9|26.5|28.9|238.5
Kia|K900|2015-2020|82.5|29.0|28.5|32.5|256.0
Kia|Niro|2017-2020|70.5|28.5|19.5|34.5|221.5
Kia|Optima|2006-2010|74.5|27.0|24.5|26.5|227.0
Kia|Optima|2011-2015|76.5|27.5|25.5|28.5|235.5
Kia|Optima|2016-2020|78.5|28.0|26.5|30.5|244.0
Kia|Rio 4-Door|2006-2011|62.5|25.5|18.5|20.5|191.5
Kia|Rio 4-Door|2012-2017|64.5|26.0|19.5|22.5|200.0
Kia|Rio 4-Door|2018-2020|66.5|26.5|20.5|24.5|208.5
Kia|Rio 5-Door|2012-2017|62.5|26.0|19.5|26.5|200.0
Kia|Rio 5-Door|2018-2020|64.5|26.5|20.5|28.5|208.5
Kia|Rondo|2007-2010|72.5|28.5|19.5|36.5|225.5
Kia|Sedona|2002-2005|86.5|31.5|19.5|46.5|271.5
Kia|Sedona|2006-2014|88.5|32.0|20.5|48.5|281.0
Kia|Sedona|2015-2020|90.5|32.5|21.5|50.5|290.5
Kia|Seltos|2021-2023|72.5|29.0|20.5|34.5|224.0
Kia|Sorento|2003-2009|78.5|30.0|21.5|40.5|248.0
Kia|Sorento|2010-2015|80.5|30.5|22.5|42.5|256.5
Kia|Sorento|2016-2020|82.5|31.0|23.5|44.5|265.0
Kia|Soul|2010-2013|66.5|28.0|17.5|30.5|208.0
Kia|Soul|2014-2019|68.5|28.5|18.5|32.5|216.5
Kia|Soul|2020-2023|70.5|29.0|19.5|34.5|225.0
Kia|Sportage|2005-2010|74.5|29.5|20.5|36.5|237.5
Kia|Sportage|2011-2016|76.5|30.0|21.5|38.5|246.0
Kia|Sportage|2017-2020|78.5|30.5|22.5|40.5|254.5
Kia|Stinger|2018-2020|74.5|27.5|26.5|26.5|229.5
Kia|Telluride|2020-2023|86.5|32.5|24.5|48.5|280.5
Land Rover|Defender 110|2020-2023|88.5|34.5|24.5|46.5|282.5
Land Rover|Defender 90|2020-2023|76.5|34.5|24.5|34.5|250.5
Land Rover|Discovery|2017-2020|86.5|32.5|24.5|48.5|280.5
Land Rover|Discovery Sport|2015-2020|78.5|30.5|22.5|40.5|250.5
Land Rover|Freelander|2002-2005|72.5|29.5|20.5|34.5|224.5
Land Rover|LR2|2008-2015|76.5|30.0|21.5|38.5|241.0
Land Rover|LR3|2005-2009|88.5|33.5|24.5|50.5|284.5
Land Rover|LR4|2010-2016|90.5|34.0|25.5|52.5|293.0
Land Rover|Range Rover|2003-2012|92.5|34.5|26.5|54.5|300.5
Land Rover|Range Rover|2013-2020|94.5|35.0|27.5|56.5|309.0
Land Rover|Range Rover Evoque|2012-2019|72.5|29.5|21.5|34.5|226.5
Land Rover|Range Rover Evoque|2020-2023|74.5|30.0|22.5|36.5|235.0
Land Rover|Range Rover Sport|2006-2013|86.5|32.5|24.5|48.5|280.5
Land Rover|Range Rover Sport|2014-2020|88.5|33.0|25.5|50.5|289.0
Land Rover|Range Rover Velar|2018-2020|82.5|31.5|24.5|44.5|267.5
Lexus|CT 200h|2011-2017|66.5|26.5|20.5|26.5|206.5
Lexus|ES 300|1997-2003|74.5|27.0|24.5|26.5|226.0
Lexus|ES 330|2004-2006|76.5|27.5|25.5|28.5|234.5
Lexus|ES 350|2007-2012|78.5|28.0|26.5|30.5|243.0
Lexus|ES 350|2013-2018|80.5|28.5|27.5|32.5|251.5
Lexus|ES 350|2019-2020|82.5|29.0|28.5|34.5|260.0
Lexus|GS 300|1998-2005|76.5|27.5|26.5|26.5|233.5
Lexus|GS 350|2006-2011|78.5|28.0|27.5|28.5|242.0
Lexus|GS 350|2012-2020|80.5|28.5|28.5|30.5|250.5
Lexus|GS 430|2001-2007|78.5|28.0|27.5|28.5|242.0
Lexus|GS 450h|2007-2018|80.5|28.5|28.5|30.5|250.5
Lexus|GS F|2016-2020|80.5|28.5|28.5|30.5|250.5
Lexus|GX 460|2010-2020|90.5|34.0|25.5|52.5|293.0
Lexus|GX 470|2003-2009|88.5|33.5|24.5|50.5|284.5
Lexus|IS 250|2006-2013|72.5|27.0|25.5|24.5|223.0
Lexus|IS 300|2001-2005|74.5|27.5|26.5|26.5|229.5
Lexus|IS 350|2006-2013|72.5|27.0|25.5|24.5|223.0
Lexus|IS 350|2014-2020|74.5|27.5|26.5|26.5|229.5
Lexus|LC 500|2018-2020|70.5|26.5|28.5|20.5|220.5
Lexus|LC 500 Convertible|2021-2023|70.5|26.5|28.5|0|189.0
Lexus|LFA|2012|66.5|25.5|28.5|18.5|203.5
Lexus|LS 400|1995-2000|82.5|29.0|28.5|32.5|256.0
Lexus|LS 430|2001-2006|84.5|29.5|29.5|34.5|264.5
Lexus|LS 460|2007-2017|86.5|30.0|30.5|36.5|273.0
Lexus|LS 500|2018-2020|88.5|30.5|31.5|38.5|281.5
Lexus|LX 470|1998-2007|96.5|35.5|26.5|56.5|307.5
Lexus|LX 570|2008-2020|98.5|36.0|27.5|58.5|316.0
Lexus|NX 200t|2015-2017|76.5|29.5|22.5|38.5|242.5
Lexus|NX 300|2018-2020|78.5|30.0|23.5|40.5|251.0
Lexus|NX 300h|2015-2020|78.5|30.0|23.5|40.5|251.0
Lexus|RC 300|2016-2020|72.5|27.0|26.5|22.5|222.0
Lexus|RC 350|2015-2020|72.5|27.0|26.5|22.5|222.0
Lexus|RC F|2015-2020|74.5|27.5|27.5|24.5|228.5
Lexus|RX 300|1999-2003|80.5|30.5|22.5|42.5|256.5
Lexus|RX 330|2004-2006|82.5|31.0|23.5|44.5|265.0
Lexus|RX 350|2007-2009|84.5|31.5|24.5|46.5|273.5
Lexus|RX 350|2010-2015|86.5|32.0|25.5|48.5|282.0
Lexus|RX 350|2016-2020|88.5|32.5|26.5|50.5|290.5
Lexus|RX 450h|2010-2020|88.5|32.5|26.5|50.5|290.5
Lexus|SC 300|1992-2000|70.5|26.5|26.5|20.5|218.5
Lexus|SC 400|1992-2000|70.5|26.5|26.5|20.5|218.5
Lexus|SC 430|2002-2010|68.5|25.5|26.5|0|184.0
Lexus|UX 200|2019-2020|72.5|28.5|20.5|34.5|222.5
Lexus|UX 250h|2019-2020|72.5|28.5|20.5|34.5|222.5
Lincoln|Aviator|2003-2005|86.5|32.5|24.5|48.5|280.5
Lincoln|Aviator|2020-2023|88.5|33.0|25.5|50.5|289.0
Lincoln|Continental|2017-2020|82.5|29.0|28.5|32.5|258.0
Lincoln|Corsair|2020-2023|78.5|30.0|22.5|40.5|249.0
Lincoln|LS|2000-2006|76.5|27.5|26.5|26.5|233.5
Lincoln|MKC|2015-2019|76.5|29.5|21.5|38.5|241.5
Lincoln|MKS|2009-2016|80.5|28.5|27.5|30.5|249.5
Lincoln|MKT|2010-2019|88.5|30.5|22.5|48.5|276.5
Lincoln|MKX|2007-2015|82.5|30.5|23.5|44.5|261.5
Lincoln|MKX|2016-2018|84.5|31.0|24.5|46.5|270.0
Lincoln|MKZ|2007-2012|76.5|27.5|25.5|28.5|235.5
Lincoln|MKZ|2013-2020|78.5|28.0|26.5|30.5|244.0
Lincoln|Nautilus|2019-2020|84.5|31.0|24.5|46.5|270.0
Lincoln|Navigator|1998-2002|92.5|34.5|25.5|54.5|299.5
Lincoln|Navigator|2003-2006|94.5|35.0|26.5|56.5|308.0
Lincoln|Navigator|2007-2017|96.5|35.5|27.5|58.5|316.5
Lincoln|Navigator|2018-2020|100.5|36.5|28.5|62.5|330.5
Lincoln|Navigator L|2007-2017|104.5|35.5|27.5|66.5|336.5
Lincoln|Navigator L|2018-2020|108.5|36.5|28.5|70.5|350.5
Lincoln|Town Car|1998-2011|84.5|29.5|28.5|32.5|261.5
Lincoln|Zephyr|2006|76.5|27.5|25.5|28.5|235.5
Maserati|Ghibli|2014-2020|76.5|27.5|27.5|26.5|234.5
Maserati|GranTurismo|2008-2019|72.5|26.5|28.5|20.5|222.5
Maserati|Levante|2017-2020|84.5|31.5|25.5|46.5|274.5
Maserati|Quattroporte|2004-2012|80.5|28.5|28.5|30.5|252.5
Maserati|Quattroporte|2013-2020|82.5|29.0|29.5|32.5|261.0
Mazda|2|2011-2014|60.5|25.5|17.5|22.5|188.5
Mazda|3 4-Door|2004-2009|66.5|26.0|20.5|22.5|202.0
Mazda|3 4-Door|2010-2013|68.5|26.5|21.5|24.5|210.5
Mazda|3 4-Door|2014-2018|70.5|27.0|22.5|26.5|218.5
Mazda|3 4-Door|2019-2020|72.5|27.5|23.5|28.5|226.5
Mazda|3 5-Door|2004-2009|64.5|26.0|20.5|26.5|200.0
Mazda|3 5-Door|2010-2013|66.5|26.5|21.5|28.5|208.5
Mazda|3 5-Door|2014-2018|68.5|27.0|22.5|30.5|216.5
Mazda|3 5-Door|2019-2020|70.5|27.5|23.5|32.5|224.5
Mazda|5|2006-2015|72.5|28.5|18.5|38.5|226.5
Mazda|6|2003-2008|72.5|26.5|23.5|24.5|220.5
Mazda|6|2009-2013|74.5|27.0|24.5|26.5|228.5
Mazda|6|2014-2020|76.5|27.5|25.5|28.5|236.5
Mazda|B-Series Ext Cab|1998-2009|72.5|28.0|20.5|22.5|216.0
Mazda|B-Series Regular Cab|1998-2009|67.5|28.0|20.5|14.5|197.0
Mazda|CX-3|2016-2020|66.5|27.5|17.5|28.5|206.5
Mazda|CX-30|2020-2023|70.5|28.5|19.5|32.5|219.5
Mazda|CX-5|2013-2016|74.5|29.0|20.5|36.5|228.0
Mazda|CX-5|2017-2020|76.5|29.5|21.5|38.5|236.5
Mazda|CX-50|2023|80.5|30.5|23.5|42.5|255.5
Mazda|CX-7|2007-2012|76.5|29.5|21.5|38.5|241.5
Mazda|CX-9|2007-2015|84.5|31.5|23.5|46.5|269.5
Mazda|CX-9|2016-2020|86.5|32.0|24.5|48.5|278.0
Mazda|Miata MX-5|1990-1997|52.5|21.5|18.5|0|155.0
Mazda|Miata MX-5|1999-2005|54.5|22.0|19.5|0|159.5
Mazda|Miata MX-5|2006-2015|56.5|22.5|20.5|0|164.0
Mazda|Miata MX-5|2016-2020|52.5|21.5|19.5|0|157.0
Mazda|Miata MX-5 RF|2017-2020|52.5|21.5|19.5|14.5|171.5
Mazda|MPV|2000-2006|84.5|31.0|19.5|46.5|268.0
Mazda|Protege|1999-2003|64.5|25.5|19.5|20.5|196.5
Mazda|RX-7|1993-2002|60.5|24.5|24.5|16.5|190.5
Mazda|RX-8|2004-2011|66.5|25.5|24.5|20.5|203.5
Mazda|Tribute|2001-2011|74.5|28.5|19.5|35.5|225.5
Mercedes-Benz|A-Class|2019-2022|68.5|26.5|21.5|26.5|209.5
Mercedes-Benz|AMG GT|2016-2020|64.5|24.5|28.5|18.5|200.5
Mercedes-Benz|B-Class|2014-2019|68.5|27.5|19.5|32.5|215.5
Mercedes-Benz|C-Class Coupe|2001-2007|68.5|26.0|24.5|19.5|205.0
Mercedes-Benz|C-Class Coupe|2012-2015|70.5|26.5|25.5|20.5|213.5
Mercedes-Benz|C-Class Coupe|2016-2020|72.5|27.0|26.5|21.5|221.5
Mercedes-Benz|C-Class Sedan|2001-2007|70.5|27.0|24.5|24.5|218.0
Mercedes-Benz|C-Class Sedan|2008-2014|72.5|27.5|25.5|26.5|226.5
Mercedes-Benz|C-Class Sedan|2015-2020|74.5|28.0|26.5|28.5|235.0
Mercedes-Benz|C-Class Wagon|2002-2007|70.5|27.0|24.5|32.5|225.0
Mercedes-Benz|CLA-Class|2014-2019|70.5|26.5|23.5|24.5|218.5
Mercedes-Benz|CLA-Class|2020-2023|72.5|27.0|24.5|26.5|227.0
Mercedes-Benz|CLK Coupe|1998-2009|70.5|26.5|25.5|20.5|217.5
Mercedes-Benz|CLK Convertible|1998-2009|70.5|26.5|25.5|0|186.0
Mercedes-Benz|CLS-Class|2006-2011|76.5|27.5|27.5|26.5|234.5
Mercedes-Benz|CLS-Class|2012-2017|78.5|28.0|28.5|28.5|243.0
Mercedes-Benz|CLS-Class|2019-2020|80.5|28.5|29.5|30.5|251.5
Mercedes-Benz|E-Class Coupe|2010-2017|74.5|27.0|26.5|22.5|224.0
Mercedes-Benz|E-Class Coupe|2018-2020|76.5|27.5|27.5|24.5|232.5
Mercedes-Benz|E-Class Sedan|2003-2009|76.5|27.5|26.5|28.5|237.5
Mercedes-Benz|E-Class Sedan|2010-2016|78.5|28.0|27.5|30.5|246.0
Mercedes-Benz|E-Class Sedan|2017-2020|80.5|28.5|28.5|32.5|254.5
Mercedes-Benz|E-Class Wagon|2004-2009|78.5|27.5|26.5|38.5|253.5
Mercedes-Benz|E-Class Wagon|2011-2016|80.5|28.0|27.5|40.5|262.0
Mercedes-Benz|E-Class Wagon|2017-2020|82.5|28.5|28.5|42.5|270.5
Mercedes-Benz|G-Class|2002-2018|76.5|34.5|21.5|36.5|251.5
Mercedes-Benz|G-Class|2019-2023|78.5|35.0|22.5|38.5|260.0
Mercedes-Benz|GLA-Class|2015-2019|70.5|28.0|19.5|30.5|216.0
Mercedes-Benz|GLA-Class|2021-2023|72.5|28.5|20.5|32.5|224.5
Mercedes-Benz|GLB-Class|2020-2023|76.5|29.5|21.5|38.5|241.5
Mercedes-Benz|GLC-Class|2016-2020|78.5|30.0|22.5|40.5|249.0
Mercedes-Benz|GLC-Class Coupe|2017-2020|76.5|29.5|22.5|36.5|241.5
Mercedes-Benz|GLE-Class|2016-2019|84.5|31.5|24.5|46.5|271.5
Mercedes-Benz|GLE-Class|2020-2023|86.5|32.0|25.5|48.5|280.0
Mercedes-Benz|GLE-Class Coupe|2016-2019|82.5|30.5|24.5|40.5|260.5
Mercedes-Benz|GLE-Class Coupe|2021-2023|84.5|31.0|25.5|42.5|269.0
Mercedes-Benz|GLK-Class|2010-2015|76.5|29.5|21.5|38.5|241.5
Mercedes-Benz|GLS-Class|2017-2019|92.5|33.5|26.5|54.5|299.5
Mercedes-Benz|GLS-Class|2020-2023|94.5|34.0|27.5|56.5|308.0
Mercedes-Benz|M-Class|1998-2005|80.5|30.5|22.5|42.5|256.5
Mercedes-Benz|M-Class|2006-2011|82.5|31.0|23.5|44.5|265.0
Mercedes-Benz|M-Class|2012-2015|84.5|31.5|24.5|46.5|273.5
Mercedes-Benz|Metris Cargo|2016-2020|84.5|35.5|18.5|50.5|277.5
Mercedes-Benz|Metris Passenger|2016-2020|84.5|35.5|18.5|50.5|277.5
Mercedes-Benz|R-Class|2006-2013|90.5|31.5|23.5|52.5|290.5
Mercedes-Benz|S-Class|1999-2006|84.5|29.5|29.5|34.5|264.5
Mercedes-Benz|S-Class|2007-2013|86.5|30.0|30.5|36.5|273.0
Mercedes-Benz|S-Class|2014-2020|88.5|30.5|31.5|38.5|281.5
Mercedes-Benz|SL-Class|2003-2012|66.5|24.5|27.5|0|182.0
Mercedes-Benz|SL-Class|2013-2020|68.5|25.0|28.5|0|186.5
Mercedes-Benz|SLC-Class|2017-2020|62.5|23.5|24.5|0|174.0
Mercedes-Benz|SLK-Class|1998-2004|60.5|22.5|23.5|0|169.0
Mercedes-Benz|SLK-Class|2005-2011|62.5|23.0|24.5|0|173.5
Mercedes-Benz|SLK-Class|2012-2016|64.5|23.5|25.5|0|178.0
Mercedes-Benz|SLS AMG|2011-2015|68.5|25.5|30.5|18.5|207.5
Mercedes-Benz|Sprinter 2500 – 144" WB|2007-2020|99.5|47.5|17.5|57.5|320.5
Mercedes-Benz|Sprinter 2500 – 170" WB|2007-2020|113.5|49.5|17.5|67.5|354.5
Mercedes-Benz|Sprinter 2500 – 170" WB Ext|2007-2020|126.5|50.5|17.5|77.5|388.5
Mercedes-Benz|Sprinter 3500 – 144" WB|2007-2020|99.5|47.5|17.5|57.5|320.5
Mercedes-Benz|Sprinter 3500 – 170" WB|2007-2020|113.5|49.5|17.5|67.5|354.5
Mercury|Grand Marquis|1998-2011|81.5|28.5|27.5|27.5|241.5
Mercury|Mariner|2005-2011|74.5|28.5|19.5|35.5|225.5
Mercury|Milan|2006-2011|72.5|26.5|24.5|25.5|223.5
Mercury|Montego|2005-2007|78.5|28.0|25.5|29.5|239.0
Mercury|Monterey|2004-2007|92.5|32.0|19.5|47.5|279.0
Mercury|Mountaineer|2002-2010|84.5|30.5|22.5|44.5|268.5
Mercury|Sable|1996-2005|78.5|28.0|26.5|26.5|235.0
Mini|Clubman|2008-2014|58.5|25.0|15.5|26.5|190.0
Mini|Clubman|2016-2020|68.5|26.5|17.5|32.5|213.5
Mini|Convertible|2005-2015|52.5|24.0|14.5|0|143.5
Mini|Convertible|2016-2020|54.5|24.5|15.5|0|148.0
Mini|Countryman|2011-2016|66.5|27.5|17.5|32.5|211.5
Mini|Countryman|2017-2020|72.5|28.5|19.5|36.5|227.5
Mini|Hardtop 2-Door|2002-2013|52.5|24.0|14.5|25.5|170.0
Mini|Hardtop 2-Door|2014-2020|54.5|24.5|15.5|27.5|178.5
Mini|Hardtop 4-Door|2015-2020|58.5|25.0|16.5|29.5|188.0
Mini|Paceman|2013-2016|64.5|26.5|17.5|28.5|203.5
Mitsubishi|Eclipse|2000-2005|66.5|25.5|23.5|18.5|200.5
Mitsubishi|Eclipse|2006-2012|68.5|26.0|24.5|19.5|208.0
Mitsubishi|Eclipse Cross|2018-2020|72.5|28.5|19.5|34.5|222.5
Mitsubishi|Eclipse Spyder|2000-2012|66.5|25.5|23.5|0|179.0
Mitsubishi|Endeavor|2004-2011|80.5|30.0|22.5|42.5|254.0
Mitsubishi|Galant|1999-2003|72.5|26.5|23.5|24.5|220.5
Mitsubishi|Galant|2004-2012|74.5|27.0|24.5|26.5|228.5
Mitsubishi|i-MiEV|2012-2017|58.5|27.0|14.5|24.5|182.0
Mitsubishi|Lancer|2002-2007|66.5|26.0|20.5|22.5|202.0
Mitsubishi|Lancer|2008-2017|68.5|26.5|21.5|24.5|210.5
Mitsubishi|Lancer Evolution|2003-2015|70.5|27.0|22.5|24.5|217.0
Mitsubishi|Mirage 4-Door|2014-2020|60.5|25.0|16.5|20.5|185.0
Mitsubishi|Mirage 5-Door|2014-2020|58.5|25.0|16.5|24.5|185.0
Mitsubishi|Montero|2001-2006|84.5|31.5|23.5|46.5|269.5
Mitsubishi|Montero Sport|1997-2004|78.5|30.0|21.5|40.5|248.0
Mitsubishi|Outlander|2003-2006|76.5|29.0|20.5|38.5|241.0
Mitsubishi|Outlander|2007-2013|78.5|29.5|21.5|40.5|249.5
Mitsubishi|Outlander|2014-2020|80.5|30.0|22.5|42.5|258.0
Mitsubishi|Outlander Sport|2011-2020|72.5|28.5|19.5|34.5|222.5
Nissan|350Z|2003-2009|64.5|24.5|25.5|17.5|196.5
Nissan|370Z|2009-2020|66.5|25.0|26.5|18.5|202.0
Nissan|Altima 2-Door|2008-2013|72.5|26.5|24.5|20.5|218.5
Nissan|Altima 4-Door|2002-2006|72.5|27.0|24.5|26.5|224.0
Nissan|Altima 4-Door|2007-2012|74.5|27.5|25.5|28.5|232.5
Nissan|Altima 4-Door|2013-2018|76.5|28.0|26.5|30.5|241.0
Nissan|Altima 4-Door|2019-2020|78.5|28.5|27.5|32.5|249.5
Nissan|Armada|2004-2015|94.5|34.5|26.5|54.5|302.5
Nissan|Armada|2017-2020|96.5|35.0|27.5|56.5|311.0
Nissan|Cube|2009-2014|64.5|28.0|16.5|30.5|205.0
Nissan|Frontier – Crew Cab|2005-2020|84.5|30.0|23.5|28.5|252.0
Nissan|Frontier – Ext Cab|1998-2004|72.5|28.5|21.5|20.5|215.5
Nissan|Frontier – Ext Cab|2005-2020|78.5|29.5|22.5|22.5|233.5
Nissan|Frontier – Regular Cab|1998-2004|66.5|28.5|21.5|12.5|191.5
Nissan|GT-R|2009-2020|70.5|26.0|28.5|22.5|221.0
Nissan|Juke|2011-2017|66.5|27.5|18.5|28.5|207.5
Nissan|Kicks|2018-2020|68.5|28.0|18.5|30.5|213.0
Nissan|Leaf|2011-2017|68.5|27.5|19.5|30.5|214.5
Nissan|Leaf|2018-2020|70.5|28.0|20.5|32.5|222.0
Nissan|Maxima|1995-1999|74.5|27.0|25.5|26.5|227.0
Nissan|Maxima|2000-2003|76.5|27.5|26.5|28.5|235.5
Nissan|Maxima|2004-2008|78.5|28.0|27.5|30.5|244.0
Nissan|Maxima|2009-2014|80.5|28.5|28.5|32.5|252.5
Nissan|Maxima|2016-2020|82.5|29.0|29.5|34.5|261.0
Nissan|Murano|2003-2007|80.5|30.0|22.5|42.5|254.0
Nissan|Murano|2009-2014|82.5|30.5|23.5|44.5|262.5
Nissan|Murano|2015-2020|84.5|31.0|24.5|46.5|271.0
Nissan|NV 1500 – High Roof|2012-2020|108.5|52.5|20.5|66.5|364.5
Nissan|NV 1500 – Standard Roof|2012-2020|108.5|42.5|20.5|66.5|344.5
Nissan|NV 2500 – High Roof|2012-2020|108.5|52.5|20.5|66.5|364.5
Nissan|NV 2500 – Standard Roof|2012-2020|108.5|42.5|20.5|66.5|344.5
Nissan|NV 3500 – High Roof|2012-2020|108.5|52.5|20.5|66.5|364.5
Nissan|NV 3500 – Standard Roof|2012-2020|108.5|42.5|20.5|66.5|344.5
Nissan|NV200|2013-2020|72.5|30.5|17.5|38.5|246.5
Nissan|Pathfinder|1996-2004|82.5|31.0|22.5|44.5|263.0
Nissan|Pathfinder|2005-2012|84.5|31.5|23.5|46.5|271.5
Nissan|Pathfinder|2013-2020|86.5|32.0|24.5|48.5|280.0
Nissan|Quest|2004-2009|88.5|32.0|19.5|48.5|280.0
Nissan|Quest|2011-2017|90.5|32.5|20.5|50.5|288.5
Nissan|Rogue|2008-2013|76.5|29.0|21.5|38.5|241.0
Nissan|Rogue|2014-2020|78.5|29.5|22.5|40.5|249.5
Nissan|Rogue Sport|2017-2020|74.5|28.5|20.5|36.5|237.5
Nissan|Sentra|2000-2006|66.5|26.0|20.5|22.5|202.0
Nissan|Sentra|2007-2012|68.5|26.5|21.5|24.5|210.5
Nissan|Sentra|2013-2019|70.5|27.0|22.5|26.5|218.5
Nissan|Sentra|2020-2023|72.5|27.5|23.5|28.5|226.5
Nissan|Titan – Crew Cab|2004-2015|100.5|34.5|28.5|34.5|294.5
Nissan|Titan – Crew Cab|2016-2020|102.5|35.0|29.5|36.5|303.0
Nissan|Titan – Ext Cab|2004-2015|94.5|34.5|28.5|28.5|278.5
Nissan|Titan – Single Cab|2004-2015|88.5|34.5|28.5|18.5|262.5
Nissan|Titan XD – Crew Cab|2016-2020|106.5|36.0|30.5|38.5|315.0
Nissan|Versa 4-Door|2007-2011|64.5|26.0|19.5|22.5|199.0
Nissan|Versa 4-Door|2012-2019|66.5|26.5|20.5|24.5|207.5
Nissan|Versa 4-Door|2020-2023|68.5|27.0|21.5|26.5|216.0
Nissan|Versa Note|2014-2019|64.5|27.0|18.5|28.5|204.0
Nissan|Xterra|2000-2004|78.5|30.0|21.5|40.5|248.0
Nissan|Xterra|2005-2015|80.5|30.5|22.5|42.5|256.5
Oldsmobile|Alero|1999-2004|68.5|26.0|22.5|22.5|206.0
Oldsmobile|Aurora|1995-1999|80.5|28.0|27.5|28.5|247.0
Oldsmobile|Aurora|2001-2003|82.5|28.5|28.5|30.5|255.5
Oldsmobile|Bravada|1996-2001|78.5|30.0|22.5|42.5|251.0
Oldsmobile|Bravada|2002-2004|82.5|30.5|21.5|41.5|251.5
Oldsmobile|Cutlass|1997-1999|74.5|27.0|24.5|26.5|226.0
Oldsmobile|Intrigue|1998-2002|76.5|27.5|25.5|26.5|232.5
Oldsmobile|Silhouette|1997-2004|84.5|30.5|18.5|44.5|265.5
Plymouth|Neon|1995-1999|64.5|26.0|21.5|20.5|198.0
Plymouth|Prowler|1997-2002|56.5|24.0|26.5|0|170.5
Plymouth|Voyager|1996-2000|82.5|29.5|18.5|42.5|258.5
Pontiac|Aztek|2001-2005|78.5|30.0|20.5|42.5|249.0
Pontiac|Bonneville|2000-2005|80.5|28.0|27.5|28.5|247.0
Pontiac|Firebird|1993-2002|68.5|26.0|26.5|17.5|205.0
Pontiac|G5|2007-2009|66.5|25.5|21.5|20.5|200.5
Pontiac|G6|2005-2010|72.5|26.5|24.5|24.5|222.5
Pontiac|G8|2008-2009|78.5|27.5|26.5|26.5|235.5
Pontiac|Grand Am|1999-2005|70.5|26.5|23.5|22.5|209.5
Pontiac|Grand Prix|1997-2003|76.5|27.0|25.5|24.5|227.0
Pontiac|Grand Prix|2004-2008|78.5|27.5|26.5|26.5|235.5
Pontiac|Montana|1999-2005|86.5|31.0|18.5|46.5|269.0
Pontiac|Montana SV6|2005-2009|92.5|30.5|18.5|44.5|270.5
Pontiac|Solstice|2006-2009|54.5|22.5|22.5|0|163.0
Pontiac|Sunfire|1995-2005|66.5|25.5|22.5|18.5|199.5
Pontiac|Torrent|2006-2009|76.5|29.0|20.5|38.5|241.0
Pontiac|Trans Sport|1997-1998|84.5|30.5|18.5|44.5|265.5
Pontiac|Vibe|2003-2010|68.5|27.0|18.5|32.5|213.0
Porsche|718 Boxster|2017-2020|56.5|22.5|24.5|0|167.0
Porsche|718 Cayman|2017-2020|56.5|22.5|24.5|16.5|183.5
Porsche|911 Carrera|1999-2004|62.5|24.0|26.5|16.5|193.0
Porsche|911 Carrera|2005-2011|64.5|24.5|27.5|17.5|200.0
Porsche|911 Carrera|2012-2019|66.5|25.0|28.5|18.5|207.0
Porsche|911 Carrera Cabriolet|1999-2004|62.5|24.0|26.5|0|176.5
Porsche|911 Carrera Cabriolet|2005-2011|64.5|24.5|27.5|0|182.5
Porsche|911 Carrera Cabriolet|2012-2019|66.5|25.0|28.5|0|188.5
Porsche|911 Turbo|1999-2004|64.5|24.5|28.5|16.5|198.5
Porsche|911 Turbo|2005-2012|66.5|25.0|29.5|17.5|205.5
Porsche|911 Turbo|2014-2019|68.5|25.5|30.5|18.5|212.5
Porsche|918 Spyder|2014-2015|66.5|24.5|30.5|0|185.0
Porsche|Boxster|1997-2004|54.5|22.0|23.5|0|163.5
Porsche|Boxster|2005-2012|56.5|22.5|24.5|0|168.0
Porsche|Boxster|2013-2016|58.5|23.0|25.5|0|172.5
Porsche|Carrera GT|2004-2006|66.5|24.5|30.5|0|185.0
Porsche|Cayenne|2003-2010|84.5|31.5|24.5|46.5|271.5
Porsche|Cayenne|2011-2018|86.5|32.0|25.5|48.5|280.0
Porsche|Cayenne|2019-2020|88.5|32.5|26.5|50.5|288.5
Porsche|Cayman|2006-2012|58.5|23.0|25.5|16.5|188.0
Porsche|Cayman|2013-2016|60.5|23.5|26.5|17.5|194.5
Porsche|Macan|2015-2020|78.5|30.0|23.5|40.5|250.0
Porsche|Panamera|2010-2016|82.5|28.5|28.5|30.5|254.5
Porsche|Panamera|2017-2020|84.5|29.0|29.5|32.5|263.0
Porsche|Taycan|2020-2023|80.5|28.5|27.5|30.5|249.5
RAM|Cargo Van – 118" WB|2013-2020|95.5|47.5|23.5|55.5|332.5
RAM|Cargo Van – 136" WB|2013-2020|104.5|49.0|23.5|55.5|352.0
RAM|Passenger Van – 136" WB|2013-2020|104.5|49.0|23.5|55.5|352.0
Saab|9-2X|2005-2006|68.5|26.5|20.5|24.5|206.5
Saab|9-3|2003-2011|72.5|27.0|24.5|24.5|222.0
Saab|9-3 Convertible|2003-2011|72.5|27.0|24.5|0|187.5
Saab|9-3 SportCombi|2006-2011|72.5|27.0|24.5|34.5|231.0
Saab|9-5|1999-2009|78.5|27.5|26.5|28.5|239.5
Saab|9-5|2010-2011|80.5|28.0|27.5|30.5|248.0
Saab|9-7X|2005-2009|82.5|30.5|21.5|41.5|251.5
Saturn|Astra|2008-2009|64.5|26.0|18.5|26.5|201.0
Saturn|Aura|2007-2009|74.5|27.0|24.5|26.5|227.0
Saturn|Ion|2003-2007|66.5|26.0|21.5|22.5|203.0
Saturn|L-Series|2000-2005|74.5|27.0|24.5|26.5|226.0
Saturn|Outlook|2007-2010|84.5|29.5|22.5|46.5|265.5
Saturn|Relay|2005-2007|92.5|30.5|18.5|44.5|270.5
Saturn|S-Series|1996-2002|62.5|25.5|19.5|20.5|194.5
Saturn|Sky|2007-2010|54.5|22.5|22.5|0|163.0
Saturn|Vue|2002-2007|72.5|28.5|19.5|34.5|222.5
Saturn|Vue|2008-2010|74.5|29.0|20.5|36.5|231.0
Scion|FR-S|2013-2016|64.5|24.5|23.5|18.5|195.5
Scion|iA|2016|66.5|26.0|20.5|22.5|202.0
Scion|iM|2016|68.5|27.0|21.5|30.5|215.0
Scion|iQ|2012-2015|48.5|24.0|12.5|16.5|160.0
Scion|tC|2005-2010|66.5|26.0|22.5|22.5|204.0
Scion|tC|2011-2016|68.5|26.5|23.5|24.5|212.5
Scion|xA|2004-2006|60.5|26.0|16.5|24.5|193.0
Scion|xB|2004-2006|62.5|27.5|16.5|30.5|202.5
Scion|xB|2008-2015|66.5|28.0|17.5|34.5|214.0
Scion|xD|2008-2014|62.5|26.5|17.5|26.5|199.5
Smart|ForTwo|2008-2015|46.5|24.0|12.5|14.5|155.0
Smart|ForTwo|2016-2019|48.5|24.5|13.5|15.5|160.5
Subaru|Ascent|2019-2020|88.5|33.0|24.5|50.5|288.0
Subaru|B9 Tribeca|2006-2007|82.5|31.0|23.5|44.5|264.0
Subaru|Baja|2003-2006|72.5|28.0|21.5|22.5|221.0
Subaru|BRZ|2013-2020|64.5|24.5|23.5|18.5|195.5
Subaru|Crosstrek|2013-2017|72.5|28.5|20.5|34.5|223.5
Subaru|Crosstrek|2018-2020|74.5|29.0|21.5|36.5|232.0
Subaru|Forester|1998-2002|72.5|28.5|19.5|34.5|222.5
Subaru|Forester|2003-2008|74.5|29.0|20.5|36.5|231.0
Subaru|Forester|2009-2013|76.5|29.5|21.5|38.5|239.5
Subaru|Forester|2014-2018|78.5|30.0|22.5|40.5|248.0
Subaru|Forester|2019-2020|80.5|30.5|23.5|42.5|256.5
Subaru|Impreza 4-Door|2002-2007|66.5|26.0|20.5|22.5|202.0
Subaru|Impreza 4-Door|2008-2011|68.5|26.5|21.5|24.5|210.5
Subaru|Impreza 4-Door|2012-2016|70.5|27.0|22.5|26.5|218.5
Subaru|Impreza 4-Door|2017-2020|72.5|27.5|23.5|28.5|226.5
Subaru|Impreza 5-Door|2002-2007|66.5|26.0|20.5|28.5|207.5
Subaru|Impreza 5-Door|2008-2011|68.5|26.5|21.5|30.5|215.5
Subaru|Impreza 5-Door|2012-2016|70.5|27.0|22.5|32.5|223.5
Subaru|Impreza 5-Door|2017-2020|72.5|27.5|23.5|34.5|231.5
Subaru|Legacy|1995-1999|72.5|26.5|23.5|24.5|220.5
Subaru|Legacy|2000-2004|74.5|27.0|24.5|26.5|228.5
Subaru|Legacy|2005-2009|76.5|27.5|25.5|28.5|236.5
Subaru|Legacy|2010-2014|78.5|28.0|26.5|30.5|244.5
Subaru|Legacy|2015-2020|80.5|28.5|27.5|32.5|253.5
Subaru|Outback|2000-2004|76.5|27.5|24.5|36.5|241.5
Subaru|Outback|2005-2009|78.5|28.0|25.5|38.5|249.5
Subaru|Outback|2010-2014|80.5|28.5|26.5|40.5|258.5
Subaru|Outback|2015-2019|82.5|29.0|27.5|42.5|267.0
Subaru|Outback|2020-2023|84.5|29.5|28.5|44.5|275.5
Subaru|Tribeca|2008-2014|82.5|31.0|23.5|44.5|264.0
Subaru|WRX|2015-2020|72.5|27.0|23.5|26.5|223.0
Subaru|WRX STI|2015-2020|72.5|27.0|23.5|26.5|223.0
Subaru|XV Crosstrek|2013-2015|72.5|28.5|20.5|34.5|223.5
Suzuki|Equator – Crew Cab|2009-2012|84.5|30.0|23.5|28.5|252.0
Suzuki|Equator – Ext Cab|2009-2012|78.5|29.5|22.5|22.5|233.5
Suzuki|Forenza|2004-2008|66.5|26.0|20.5|22.5|202.0
Suzuki|Grand Vitara|2006-2013|72.5|28.5|19.5|34.5|222.5
Suzuki|Kizashi|2010-2013|72.5|26.5|24.5|24.5|222.5
Suzuki|Reno|2005-2008|64.5|26.0|19.5|26.5|201.0
Suzuki|SX4|2007-2013|66.5|26.5|18.5|28.5|206.5
Suzuki|Verona|2004-2006|74.5|27.0|24.5|26.5|227.0
Suzuki|Vitara|1999-2004|66.5|28.0|18.5|28.5|208.0
Suzuki|XL-7|2001-2006|78.5|30.0|21.5|40.5|248.0
Suzuki|XL-7|2007-2009|82.5|30.5|22.5|44.5|262.5
Tesla|Model 3|2017-2020|72.5|27.5|24.5|28.5|227.5
Tesla|Model S|2012-2020|80.5|28.5|27.5|32.5|253.5
Tesla|Model X|2016-2020|88.5|33.0|25.5|50.5|289.0
Tesla|Model Y|2020-2023|78.5|30.0|23.5|40.5|250.0
Tesla|Roadster|2008-2012|54.5|22.5|22.5|0|163.0
Toyota|4Runner|1996-2002|78.5|30.0|21.5|40.5|248.0
Toyota|4Runner|2003-2009|80.5|30.5|22.5|42.5|256.5
Toyota|4Runner|2010-2020|82.5|31.0|23.5|44.5|265.0
Toyota|86|2017-2020|64.5|24.5|23.5|18.5|195.5
Toyota|Avalon|1995-1999|78.5|27.5|26.5|28.5|239.5
Toyota|Avalon|2000-2004|80.5|28.0|27.5|30.5|248.0
Toyota|Avalon|2005-2012|82.5|28.5|28.5|32.5|256.5
Toyota|Avalon|2013-2018|84.5|29.0|29.5|34.5|265.0
Toyota|Avalon|2019-2020|86.5|29.5|30.5|36.5|273.5
Toyota|C-HR|2018-2020|68.5|27.5|18.5|30.5|213.0
Toyota|Camry|1997-2001|74.5|27.0|24.5|26.5|226.0
Toyota|Camry|2002-2006|76.5|27.5|25.5|28.5|234.5
Toyota|Camry|2007-2011|78.5|28.0|26.5|30.5|243.0
Toyota|Camry|2012-2017|80.5|28.5|27.5|32.5|251.5
Toyota|Camry|2018-2020|82.5|29.0|28.5|34.5|260.0
Toyota|Celica|1994-1999|66.5|25.0|23.5|18.5|200.0
Toyota|Celica|2000-2005|68.5|25.5|24.5|19.5|206.5
Toyota|Corolla|1998-2002|66.5|26.0|20.5|22.5|202.0
Toyota|Corolla|2003-2008|68.5|26.5|21.5|24.5|210.5
Toyota|Corolla|2009-2013|70.5|27.0|22.5|26.5|218.5
Toyota|Corolla|2014-2019|72.5|27.5|23.5|28.5|226.5
Toyota|Corolla|2020-2023|74.5|28.0|24.5|30.5|234.5
Toyota|Corolla 5-Door|2019-2020|70.5|27.5|23.5|32.5|226.5
Toyota|Echo|2000-2005|60.5|25.5|17.5|20.5|188.5
Toyota|FJ Cruiser|2007-2014|76.5|30.5|21.5|38.5|243.5
Toyota|Highlander|2001-2007|80.5|30.0|22.5|42.5|254.0
Toyota|Highlander|2008-2013|82.5|30.5|23.5|44.5|262.5
Toyota|Highlander|2014-2019|84.5|31.0|24.5|46.5|271.0
Toyota|Highlander|2020-2023|86.5|31.5|25.5|48.5|279.5
Toyota|Land Cruiser|1998-2007|94.5|34.0|25.5|54.5|301.0
Toyota|Land Cruiser|2008-2020|96.5|34.5|26.5|56.5|309.5
Toyota|Matrix|2003-2008|66.5|27.0|18.5|30.5|208.0
Toyota|Matrix|2009-2014|68.5|27.5|19.5|32.5|216.0
Toyota|MR2 Spyder|2000-2005|54.5|22.0|22.5|0|162.5
Toyota|Prius|2001-2003|66.5|27.0|20.5|28.5|209.0
Toyota|Prius|2004-2009|68.5|27.5|21.5|30.5|217.0
Toyota|Prius|2010-2015|70.5|28.0|22.5|32.5|225.0
Toyota|Prius|2016-2020|72.5|28.5|23.5|34.5|233.0
Toyota|Prius C|2012-2019|62.5|26.5|18.5|26.5|200.0
Toyota|Prius Prime|2017-2020|72.5|28.5|23.5|34.5|233.0
Toyota|Prius V|2012-2017|74.5|28.5|22.5|38.5|241.5
Toyota|RAV4|1996-2000|70.5|28.0|18.5|32.5|217.0
Toyota|RAV4|2001-2005|72.5|28.5|19.5|34.5|225.0
Toyota|RAV4|2006-2012|74.5|29.0|20.5|36.5|233.0
Toyota|RAV4|2013-2018|76.5|29.5|21.5|38.5|241.0
Toyota|RAV4|2019-2020|78.5|30.0|22.5|40.5|249.0
Toyota|Sequoia|2001-2007|92.5|33.5|25.5|52.5|296.5
Toyota|Sequoia|2008-2020|94.5|34.0|26.5|54.5|305.0
Toyota|Sienna|1998-2003|86.5|31.5|19.5|48.5|273.5
Toyota|Sienna|2004-2010|88.5|32.0|20.5|50.5|282.0
Toyota|Sienna|2011-2020|90.5|32.5|21.5|52.5|290.5
Toyota|Solara Convertible|1999-2003|72.5|26.5|25.5|0|188.0
Toyota|Solara Convertible|2004-2008|74.5|27.0|26.5|0|194.5
Toyota|Solara Coupe|1999-2003|72.5|26.5|25.5|20.5|208.5
Toyota|Solara Coupe|2004-2008|74.5|27.0|26.5|21.5|215.5
Toyota|Supra|1993-1998|68.5|25.5|26.5|18.5|203.5
Toyota|Supra|2020-2023|66.5|25.0|26.5|18.5|200.0
Toyota|Tacoma – Access Cab|2005-2015|78.5|28.5|22.5|22.5|231.5
Toyota|Tacoma – Access Cab|2016-2020|80.5|29.0|23.5|24.5|239.0
Toyota|Tacoma – Double Cab|2005-2015|84.5|28.5|22.5|28.5|249.5
Toyota|Tacoma – Double Cab|2016-2020|86.5|29.0|23.5|30.5|257.0
Toyota|Tacoma – Regular Cab|1995-2004|66.5|27.5|20.5|12.5|193.5
Toyota|Tacoma – Regular Cab|2005-2015|72.5|28.5|22.5|14.5|211.5
Toyota|Tundra – CrewMax|2007-2013|102.5|34.0|28.5|36.5|304.0
Toyota|Tundra – CrewMax|2014-2020|104.5|34.5|29.5|38.5|312.5
Toyota|Tundra – Double Cab|2007-2013|96.5|34.0|28.5|30.5|288.0
Toyota|Tundra – Double Cab|2014-2020|98.5|34.5|29.5|32.5|296.5
Toyota|Tundra – Ext Cab|2000-2006|92.5|33.0|27.5|26.5|276.0
Toyota|Tundra – Regular Cab|2000-2006|82.5|33.0|27.5|16.5|252.0
Toyota|Tundra – Regular Cab|2007-2013|86.5|34.0|28.5|18.5|264.0
Toyota|Venza|2009-2015|82.5|29.5|24.5|40.5|257.5
Toyota|Yaris 4-Door|2007-2011|60.5|25.5|17.5|20.5|188.5
Toyota|Yaris 4-Door|2012-2018|62.5|26.0|18.5|22.5|196.5
Toyota|Yaris 4-Door|2019-2020|66.5|26.5|20.5|22.5|202.5
Toyota|Yaris 5-Door|2007-2011|58.5|25.5|17.5|24.5|188.5
Toyota|Yaris 5-Door|2012-2018|60.5|26.0|18.5|26.5|196.5
Volkswagen|Arteon|2019-2020|78.5|28.0|27.5|30.5|246.0
Volkswagen|Atlas|2018-2020|88.5|33.0|25.5|50.5|289.0
Volkswagen|Atlas Cross Sport|2020-2023|84.5|32.0|24.5|44.5|269.0
Volkswagen|Beetle|1998-2010|64.5|26.0|20.5|22.5|200.0
Volkswagen|Beetle|2012-2019|66.5|26.5|21.5|24.5|208.5
Volkswagen|Beetle Convertible|2003-2010|64.5|26.0|20.5|0|177.5
Volkswagen|Beetle Convertible|2013-2019|66.5|26.5|21.5|0|181.0
Volkswagen|CC|2009-2017|76.5|27.5|26.5|28.5|237.5
Volkswagen|Eos|2007-2016|68.5|26.0|24.5|0|183.5
Volkswagen|Golf|1999-2006|64.5|26.0|19.5|24.5|200.0
Volkswagen|Golf|2007-2014|66.5|26.5|20.5|26.5|208.5
Volkswagen|Golf|2015-2020|68.5|27.0|21.5|28.5|216.5
Volkswagen|Golf R|2015-2020|68.5|27.0|21.5|28.5|216.5
Volkswagen|GTI|2006-2014|66.5|26.5|20.5|26.5|208.5
Volkswagen|GTI|2015-2020|68.5|27.0|21.5|28.5|216.5
Volkswagen|ID.4|2021-2023|78.5|30.0|22.5|40.5|249.0
Volkswagen|Jetta|1999-2005|68.5|26.5|21.5|24.5|207.5
Volkswagen|Jetta|2006-2010|70.5|27.0|22.5|26.5|215.5
Volkswagen|Jetta|2011-2018|72.5|27.5|23.5|28.5|223.5
Volkswagen|Jetta|2019-2020|74.5|28.0|24.5|30.5|231.5
Volkswagen|Jetta Sportwagen|2009-2014|70.5|27.0|22.5|34.5|223.0
Volkswagen|Passat|1998-2005|74.5|27.0|24.5|26.5|226.0
Volkswagen|Passat|2006-2010|76.5|27.5|25.5|28.5|234.5
Volkswagen|Passat|2011-2019|78.5|28.0|26.5|30.5|243.0
Volkswagen|Phaeton|2004-2006|82.5|29.0|28.5|32.5|258.0
Volkswagen|Routan|2009-2014|90.5|32.0|19.5|48.5|282.0
Volkswagen|Tiguan|2009-2017|72.5|28.5|19.5|34.5|222.5
Volkswagen|Tiguan|2018-2020|78.5|29.5|21.5|40.5|248.5
Volkswagen|Touareg|2004-2010|82.5|31.0|23.5|44.5|264.0
Volkswagen|Touareg|2011-2017|84.5|31.5|24.5|46.5|272.5
Volvo|C30|2008-2013|64.5|26.0|20.5|24.5|201.0
Volvo|C70|2006-2013|70.5|26.5|24.5|0|185.0
Volvo|S40|2004-2011|68.5|26.5|22.5|24.5|208.5
Volvo|S60|2001-2009|72.5|27.0|24.5|26.5|224.0
Volvo|S60|2011-2018|74.5|27.5|25.5|28.5|232.5
Volvo|S60|2019-2020|76.5|28.0|26.5|30.5|241.0
Volvo|S80|1999-2006|78.5|27.5|26.5|28.5|239.5
Volvo|S80|2007-2016|80.5|28.0|27.5|30.5|248.0
Volvo|S90|2017-2020|82.5|28.5|28.5|32.5|256.5
Volvo|V40|2000-2004|68.5|26.5|22.5|32.5|216.5
Volvo|V50|2005-2011|68.5|26.5|22.5|32.5|216.5
Volvo|V60|2015-2018|74.5|27.5|25.5|36.5|240.5
Volvo|V60|2019-2020|76.5|28.0|26.5|38.5|249.0
Volvo|V60 Cross Country|2015-2018|76.5|28.0|25.5|38.5|245.0
Volvo|V60 Cross Country|2019-2020|78.5|28.5|26.5|40.5|253.5
Volvo|V70|1998-2000|78.5|27.5|26.5|38.5|251.5
Volvo|V70|2001-2007|80.5|28.0|27.5|40.5|260.0
Volvo|V70|2008-2010|82.5|28.5|28.5|42.5|268.5
Volvo|V90|2017-2020|84.5|29.0|29.5|44.5|277.0
Volvo|V90 Cross Country|2017-2020|86.5|29.5|29.5|46.5|284.5
Volvo|XC40|2019-2020|72.5|29.0|20.5|34.5|224.0
Volvo|XC60|2010-2017|78.5|29.5|22.5|40.5|249.5
Volvo|XC60|2018-2020|80.5|30.0|23.5|42.5|258.0
Volvo|XC70|2003-2007|80.5|28.5|27.5|42.5|261.5
Volvo|XC70|2008-2016|82.5|29.0|28.5|44.5|270.0
Volvo|XC90|2003-2014|86.5|31.5|25.5|50.5|282.5
Volvo|XC90|2016-2020|88.5|32.0|26.5|52.5|291.0
Western Star|4700|2011-2020|145.5|68.5|35.5|85.5|503.5
Western Star|4800|2011-2020|155.5|72.5|38.5|95.5|548.5
Western Star|4900|2011-2020|165.5|76.5|40.5|105.5|588.5
Western Star|5700|2011-2020|175.5|80.5|42.5|115.5|628.5`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting vehicle sync...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the vehicle data
    const lines = VEHICLE_DATA.trim().split("\n");
    const vehicles: any[] = [];

    for (const line of lines) {
      const parts = line.split("|");
      if (parts.length >= 8) {
        const [make, model, year, sideSqFt, backSqFt, hoodSqFt, roofSqFt, totalSqFt] = parts;
        
        // Parse year range
        let yearStart: number | null = null;
        let yearEnd: number | null = null;
        
        if (year && year !== "-") {
          if (year.includes("-")) {
            const [start, end] = year.split("-");
            yearStart = parseInt(start) || null;
            yearEnd = parseInt(end) || null;
          } else {
            yearStart = parseInt(year) || null;
            yearEnd = yearStart;
          }
        }

        vehicles.push({
          make: make.trim(),
          model: model.trim(),
          year: year.trim(),
          year_start: yearStart,
          year_end: yearEnd,
          side_sqft: parseFloat(sideSqFt) || null,
          back_sqft: parseFloat(backSqFt) || null,
          hood_sqft: parseFloat(hoodSqFt) || null,
          roof_sqft: parseFloat(roofSqFt) || null,
          corrected_sqft: parseFloat(totalSqFt) || null,
        });
      }
    }

    console.log(`📊 Parsed ${vehicles.length} vehicles`);

    // Clear existing data
    const { error: deleteError } = await supabase
      .from("vehicle_dimensions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw new Error(`Failed to clear existing data: ${deleteError.message}`);
    }

    console.log("🗑️ Cleared existing vehicle data");

    // Insert in batches of 200
    const batchSize = 200;
    let insertedCount = 0;

    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from("vehicle_dimensions")
        .insert(batch);

      if (insertError) {
        console.error(`Batch insert error at ${i}:`, insertError);
        throw new Error(`Failed to insert batch: ${insertError.message}`);
      }

      insertedCount += batch.length;
      console.log(`✅ Inserted ${insertedCount}/${vehicles.length} vehicles`);
    }

    console.log(`🎉 Successfully synced ${vehicles.length} vehicles!`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${vehicles.length} vehicles to database`,
        count: vehicles.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error syncing vehicles:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
