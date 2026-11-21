-- Atualiza imagens sem alterar preços e pedidos.
UPDATE public.products AS p
SET image = v.image
FROM (VALUES
  (1::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Blister_remedio.jpg?width=640'),
  (2::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Vitamin_C_supplements_1.jpg?width=640'),
  (4::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Paracetamol_generico.jpg?width=640'),
  (5::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Omega_3_Fish_oil_softgel_capsules.jpg?width=640'),
  (7::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Equate_Ibuprofen_Pills_and_Bottle.JPG?width=640'),
  (8::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/COLLAGEN_PROTIEN.png?width=640'),
  (9::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Pills_in_blister_pack.jpg?width=640'),
  (10::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Blister_pack.jpg?width=640'),
  (11::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Tylenol_bottle_closeup.jpg?width=640'),
  (12::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Antibiotic_pills.jpg?width=640'),
  (13::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Losartan_potassium1.jpg?width=640'),
  (14::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Metformin_500mg_Tablets.jpg?width=640'),
  (15::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Omeprazol.jpg?width=640'),
  (16::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Simvastatin_varieties.jpg?width=640'),
  (17::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Atenolol_tablets_%28UK%29.jpg?width=640'),
  (18::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/VitaminSupplementPills.jpg?width=640'),
  (19::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Magnesium_Glycinate.jpg?width=640'),
  (20::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/B_vitamin_supplement_tablets.jpg?width=640'),
  (25::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Digital_Thermometer.jpg?width=640'),
  (26::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Digital_Blood_Pressure_Monitor.jpg?width=640'),
  (27::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Accu-Answer_blood_glucose_meter_with_accessories.jpg?width=640'),
  (28::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Medical_Nebulizer.jpg?width=640'),
  (29::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Pulox_Pulse_Oximeter.JPG?width=640'),
  (30::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Daiso_instant_cold_pack_300g.jpg?width=640'),
  (31::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Toothbrush%2C_Toothpaste%2C_Dental_Care_%28571741%29.jpg?width=640'),
  (32::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Standard_First_Aid_Kit_and_Essential_Emergency_Medical_Supplies_01.jpg?width=640'),
  (33::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/After-Sun-Lotion.jpg?width=640'),
  (34::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Vitamin_C_supplements_2.jpg?width=640'),
  (35::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/A_bottle_of_Aveeno_Baby_Wash_%26_Shampoo_01.jpg?width=640'),
  (36::bigint, 'https://commons.wikimedia.org/wiki/Special:FilePath/Baby_Care.jpg?width=640')
) AS v(id,image)
WHERE p.id = v.id;

SELECT id, name, image FROM public.products WHERE id IN (1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36) ORDER BY id;
