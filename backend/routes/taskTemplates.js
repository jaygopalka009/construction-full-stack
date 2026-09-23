const categoryTaskTemplates = {
  'Bungalows': [
    '1. Land Survey & Plot Layout Planning',
    '2. Foundation Soil Excavation',
    '3. Footing, Plinth Beam & Concrete Structure',
    '4. RCC Slab Casting & Curing',
    '5. Brickwork Masonry & Internal/External Plastering',
    '6. Electrical Concealed Piping & Wiring',
    '7. Plumbing & Bathroom Wall Tiles Fitting',
    '8. Wooden Doors & Modular Furniture Joinery',
    '9. Interior & Exterior Paint Coating',
    '10. Deep Site Cleaning & Final Handover (100% Progress)'
  ],
  'Building': [
    '1. Soil Testing & Tower Foundation Demarcation',
    '2. Basement Excavation & Retaining Wall RCC',
    '3. Multi-Storey Column Casting & Floor Slabs',
    '4. Exterior AAC Block Masonry & Outer Plaster',
    '5. Concealed Electrical & Plumbing Rough-In',
    '6. Flooring Tiles, Kitchen Platform & Wall Tiles',
    '7. Door Shutters, Aluminum Windows & Hardware',
    '8. Exterior Weatherproof & Interior Emulsion Paint',
    '9. Lift Installation & Fire Safety Infrastructure',
    '10. Final Building Audit & Certificate Handover'
  ],
  'Row House': [
    '1. Demarcation & Boundary Trench Excavation',
    '2. Combined Footing & Plinth Beam Casting',
    '3. Ground & First Floor RCC Frame Work',
    '4. Brick Masonry & Internal/External Plastering',
    '5. Concealed Conduit Wiring & Sanitary Lines',
    '6. Vitrified Flooring & Bathroom Wall Tiles',
    '7. Wooden Doors, Window Frames & Millwork',
    '8. Two-Coat Exterior & Interior Painting',
    '9. Site Deep Cleaning & Final Touchup'
  ],
  'Road Work': [
    '1. Terrain Survey, Leveling & Subgrade Excavation',
    '2. Soil Compaction & Granular Sub-Base (GSB) Layer',
    '3. Wet Mix Macadam (WMM) Base Layer Laying',
    '4. Bituminous Prime Coat & Dense Bituminous Macadam (DBM)',
    '5. Asphalt Bituminous Concrete (BC) Top Surface Roller Laying',
    '6. Curb Stone Fitting & Road Line Thermoplastic Marking'
  ],
  'Bridge': [
    '1. Hydrological Survey & Soil Strata Borehole Audit',
    '2. Riverbed / Deep Foundation Pile Pier Casting',
    '3. Pier Cap & Concrete Abutment Construction',
    '4. Pre-Stressed Concrete Girder Launching',
    '5. Deck Slab Reinforcement & Concrete Casting',
    '6. Bridge Expansion Joints, Crash Barriers & Asphalt Paving'
  ]
};

const getCategoryTasks = (category) => {
  return categoryTaskTemplates[category] || categoryTaskTemplates['Building'];
};

module.exports = {
  categoryTaskTemplates,
  getCategoryTasks
};
