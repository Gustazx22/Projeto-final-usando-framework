export const demoCatalog = [
    {
      id: 'medicamentos',
      label: 'Medicamentos',
      products: [
        { id: 1, name: 'Dipirona 500mg', category: 'medicamentos', price: 8.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Blister_remedio.jpg?width=640', badge: 'bestseller', description: 'Analgésico e antitérmico genérico' },
        { id: 4, name: 'Paracetamol 750mg', category: 'medicamentos', price: 6.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Paracetamol_generico.jpg?width=640', badge: null, description: 'Analgésico e antitérmico' },
        { id: 7, name: 'Ibuprofeno 600mg', category: 'medicamentos', price: 15.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Equate_Ibuprofen_Pills_and_Bottle.JPG?width=640', badge: 'sale', description: 'Anti-inflamatório não esteroidal' },
        { id: 9, name: 'Dorflex 35mg', category: 'medicamentos', price: 12.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pills_in_blister_pack.jpg?width=640', badge: 'bestseller', description: 'Relaxante muscular e analgésico' },
        { id: 10, name: 'Buscopan 10mg', category: 'medicamentos', price: 18.50, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Blister_pack.jpg?width=640', badge: null, description: 'Antiespasmódico para cólicas' },
        { id: 11, name: 'Tylenol 750mg', category: 'medicamentos', price: 22.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tylenol_bottle_closeup.jpg?width=640', badge: 'new', description: 'Paracetamol de liberação prolongada' },
      ]
    },
    {
      id: 'genericos',
      label: 'Genéricos',
      products: [
        { id: 12, name: 'Amoxicilina 500mg (Genérico)', category: 'genericos', price: 14.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Antibiotic_pills.jpg?width=640', badge: 'bestseller', description: 'Antibiótico de amplo espectro' },
        { id: 13, name: 'Losartana 50mg (Genérico)', category: 'genericos', price: 9.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Losartan_potassium1.jpg?width=640', badge: null, description: 'Para hipertensão arterial' },
        { id: 14, name: 'Metformina 850mg (Genérico)', category: 'genericos', price: 7.50, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Metformin_500mg_Tablets.jpg?width=640', badge: 'sale', description: 'Diabetes tipo 2' },
        { id: 15, name: 'Omeprazol 20mg (Genérico)', category: 'genericos', price: 11.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Omeprazol.jpg?width=640', badge: null, description: 'Protetor gástrico' },
        { id: 16, name: 'Sinvastatina 20mg (Genérico)', category: 'genericos', price: 8.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Simvastatin_varieties.jpg?width=640', badge: 'bestseller', description: 'Controle de colesterol' },
        { id: 17, name: 'Atenolol 25mg (Genérico)', category: 'genericos', price: 6.50, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Atenolol_tablets_%28UK%29.jpg?width=640', badge: null, description: 'Betabloqueador para pressão' },
      ]
    },
    {
      id: 'vitaminas',
      label: 'Vitaminas e Suplementos',
      products: [
        { id: 2, name: 'Vitamina C 1g', category: 'vitaminas', price: 12.50, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vitamin_C_supplements_1.jpg?width=640', badge: 'new', description: 'Suplemento vitamínico efervescente' },
        { id: 5, name: 'Ômega 3 1000mg', category: 'vitaminas', price: 38.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Omega_3_Fish_oil_softgel_capsules.jpg?width=640', badge: 'bestseller', description: 'Ácidos graxos essenciais' },
        { id: 8, name: 'Colágeno Hidrolisado', category: 'vitaminas', price: 55.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/COLLAGEN_PROTIEN.png?width=640', badge: 'new', description: 'Pele, cabelo e unhas' },
        { id: 18, name: 'Vitamina D3 2000UI', category: 'vitaminas', price: 28.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/VitaminSupplementPills.jpg?width=640', badge: 'bestseller', description: 'Imunidade e ossos' },
        { id: 19, name: 'Magnésio Quelato', category: 'vitaminas', price: 32.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Magnesium_Glycinate.jpg?width=640', badge: null, description: 'Relaxamento muscular' },
        { id: 20, name: 'Complexo B', category: 'vitaminas', price: 19.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/B_vitamin_supplement_tablets.jpg?width=640', badge: 'sale', description: 'Energia e metabolismo' },
      ]
    },
    {
      id: 'higiene',
      label: 'Higiene e Beleza',
      products: [
        { id: 3, name: 'Protetor Solar FPS 50', category: 'higiene', price: 45.90, image: '/products/higiene/protetor-solar.svg', badge: 'sale', description: 'UVA/UVB resistente à água' },
        { id: 6, name: 'Shampoo Anticaspa', category: 'higiene', price: 28.90, image: '/products/higiene/shampoo-anticaspa.svg', badge: null, description: 'Caspa e seborreia' },
        { id: 21, name: 'Hidratante Corporal', category: 'higiene', price: 35.90, image: '/products/higiene/hidratante-corporal.svg', badge: 'new', description: 'Pele seca e sensível' },
        { id: 22, name: 'Sabonete Líquido Neutro', category: 'higiene', price: 18.90, image: '/products/higiene/sabonete-liquido.svg', badge: null, description: 'Limpeza suave diária' },
        { id: 23, name: 'Creme Dental Clareador', category: 'higiene', price: 14.90, image: '/products/higiene/creme-dental.svg', badge: 'bestseller', description: 'Branqueamento gradual' },
        { id: 24, name: 'Desodorante Roll-on 48h', category: 'higiene', price: 22.90, image: '/products/higiene/desodorante-roll-on.svg', badge: null, description: 'Proteção prolongada' },
      ]
    },
    {
      id: 'cuidados',
      label: 'Cuidados com a Saúde',
      products: [
        { id: 25, name: 'Termômetro Digital', category: 'cuidados', price: 24.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Digital_Thermometer.jpg?width=640', badge: 'bestseller', description: 'Leitura rápida e precisa' },
        { id: 26, name: 'Monitor Pressão Braço', category: 'cuidados', price: 189.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Digital_Blood_Pressure_Monitor.jpg?width=640', badge: null, description: 'Automático com memória' },
        { id: 27, name: 'Glicosímetro + Tiras', category: 'cuidados', price: 89.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Accu-Answer_blood_glucose_meter_with_accessories.jpg?width=640', badge: 'sale', description: 'Diabetes - kit completo' },
        { id: 28, name: 'Nebulizador Ultrassônico', category: 'cuidados', price: 159.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Medical_Nebulizer.jpg?width=640', badge: 'new', description: 'Silencioso e portátil' },
        { id: 29, name: 'Oxímetro de Dedo', category: 'cuidados', price: 69.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pulox_Pulse_Oximeter.JPG?width=640', badge: 'bestseller', description: 'Saturação e batimentos' },
        { id: 30, name: 'Bolsa Térmica Gel', category: 'cuidados', price: 19.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Daiso_instant_cold_pack_300g.jpg?width=640', badge: null, description: 'Quente/frio para dores' },
      ]
    },
    {
      id: 'ofertas',
      label: 'Ofertas Especiais',
      products: [
        { id: 31, name: 'Kit Higiene Bucal', category: 'ofertas', price: 29.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Toothbrush%2C_Toothpaste%2C_Dental_Care_%28571741%29.jpg?width=640', badge: 'sale', description: 'Escova + pasta + fio dental' },
        { id: 32, name: 'Kit Primeiros Socorros', category: 'ofertas', price: 49.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Standard_First_Aid_Kit_and_Essential_Emergency_Medical_Supplies_01.jpg?width=640', badge: 'bestseller', description: 'Curativos, antisséptico, tesoura' },
        { id: 33, name: 'Protetor Solar + Pós-sol', category: 'ofertas', price: 59.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/After-Sun-Lotion.jpg?width=640', badge: 'sale', description: 'Dupla proteção verão' },
        { id: 34, name: 'Vitamina C + Zinco', category: 'ofertas', price: 34.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vitamin_C_supplements_2.jpg?width=640', badge: 'new', description: 'Imunidade reforçada' },
        { id: 35, name: 'Shampoo + Condicionador', category: 'ofertas', price: 42.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/A_bottle_of_Aveeno_Baby_Wash_%26_Shampoo_01.jpg?width=640', badge: null, description: 'Cabelos saudáveis' },
        { id: 36, name: 'Kit Bebê Completo', category: 'ofertas', price: 79.90, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Baby_Care.jpg?width=640', badge: 'bestseller', description: 'Sabonete, shampoo, pomada, óleo' },
      ]
    },
  ]

