export const CONSTRUCTION_LABOR_CATEGORIES = [
  { id: 'Mason', label: 'Mason', defaultWage: 800, description: 'Brickwork, block masonry, plastering & mortar work' },
  { id: 'Helper / General Labor', label: 'Helper / Labor', defaultWage: 450, description: 'Site material handling, mixing & general assistance' },
  { id: 'Bar Bender / Steel Fixer', label: 'Bar Bender', defaultWage: 700, description: 'TMT rebar cutting, bending, tying & beam reinforcement' },
  { id: 'Carpenter / Shuttering', label: 'Carpenter', defaultWage: 750, description: 'Formwork, ply shuttering, scaffolding & centering' },
  { id: 'Plumber', label: 'Plumber', defaultWage: 650, description: 'Concealed CPVC/UPVC piping, drainage & sanitary fixtures' },
  { id: 'Electrician', label: 'Electrician', defaultWage: 650, description: 'Conduit piping, copper wiring, DB dressing & fittings' },
  { id: 'Painter', label: 'Painter', defaultWage: 600, description: 'Primer coating, putty application, emulsion & exterior painting' },
  { id: 'Tiles Mason', label: 'Tiles Mason', defaultWage: 850, description: 'Vitrified flooring, bathroom wall tiles & marble laying' },
  { id: 'Welder', label: 'Welder', defaultWage: 700, description: 'Structural steel fabrication, MS grill welding & safety railings' },
  { id: 'Machine Operator', label: 'Machine Operator', defaultWage: 900, description: 'JCB excavator, concrete mixer & crane equipment operation' }
];

export const getCategoryDefaultWage = (categoryId) => {
  const match = CONSTRUCTION_LABOR_CATEGORIES.find(
    c => c.id.toLowerCase() === (categoryId || '').toLowerCase() || c.label.toLowerCase() === (categoryId || '').toLowerCase()
  );
  return match ? match.defaultWage : 500;
};

export const isWorkerInTrade = (workerTrade, categoryIdOrLabel) => {
  if (!workerTrade || !categoryIdOrLabel) return false;
  const wt = workerTrade.toLowerCase().trim();
  const target = categoryIdOrLabel.toLowerCase().trim();

  if (target === 'all') return true;

  // Exact match
  if (wt === target) return true;

  // Crucial distinction: Tiles Mason must NOT count as standard Mason
  if (target === 'mason' || target === 'masonry') {
    if (wt.includes('tiles') || wt.includes('tile')) return false;
    return wt === 'mason' || wt.includes('mason');
  }

  if (target === 'tiles mason' || target.includes('tiles') || target.includes('tile')) {
    return wt.includes('tiles') || wt.includes('tile');
  }

  if (target.includes('bar bender') || target.includes('steel fixer') || target === 'bar bender') {
    return wt.includes('bar bender') || wt.includes('steel fixer') || wt.includes('bender');
  }

  if (target.includes('carpenter') || target.includes('shuttering')) {
    return wt.includes('carpenter') || wt.includes('shuttering');
  }

  if (target.includes('helper') || target.includes('general labor') || target === 'helper / labor') {
    return wt.includes('helper') || wt.includes('general labor') || wt.includes('labor') || wt.includes('labour');
  }

  if (target.includes('plumber')) {
    return wt.includes('plumber');
  }

  if (target.includes('electrician')) {
    return wt.includes('electrician');
  }

  if (target.includes('painter')) {
    return wt.includes('painter');
  }

  if (target.includes('welder')) {
    return wt.includes('welder');
  }

  if (target.includes('machine operator') || target.includes('operator')) {
    return wt.includes('machine') || wt.includes('operator') || wt.includes('crane') || wt.includes('jcb');
  }

  // Check matching category object
  const catObj = CONSTRUCTION_LABOR_CATEGORIES.find(
    c => c.id.toLowerCase() === target || c.label.toLowerCase() === target
  );

  if (catObj) {
    const idLower = catObj.id.toLowerCase();
    const labelLower = catObj.label.toLowerCase();
    if (idLower === 'mason' || labelLower === 'mason') {
      return !wt.includes('tiles') && !wt.includes('tile') && wt.includes('mason');
    }
    return wt === idLower || wt === labelLower || wt.includes(idLower) || wt.includes(labelLower);
  }

  return wt === target;
};

/**
 * Returns all labor category IDs
 * @returns {string[]} Array of category ID strings
 */
export const getAllLaborCategoryIds = () => {
  return CONSTRUCTION_LABOR_CATEGORIES.map(c => c.id);
};

/**
 * Retrieves the work description of a labor trade category
 * @param {string} categoryId - Category identifier or trade name
 * @returns {string} Description of responsibilities
 */
export const getLaborCategoryDescription = (categoryId) => {
  if (!categoryId) return '';
  const match = CONSTRUCTION_LABOR_CATEGORIES.find(
    c => c.id.toLowerCase() === categoryId.toLowerCase() || c.label.toLowerCase() === categoryId.toLowerCase()
  );
  return match ? match.description : '';
};

/**
 * Provides standard theme accent colors for labor trades
 * @param {string} categoryId - Category identifier or trade name
 * @returns {string} Hex color string
 */
export const getLaborCategoryColor = (categoryId) => {
  const target = (categoryId || '').toLowerCase();
  if (target.includes('mason') && !target.includes('tile')) return '#f59e0b';
  if (target.includes('tile')) return '#8b5cf6';
  if (target.includes('helper') || target.includes('labor')) return '#10b981';
  if (target.includes('bar bender') || target.includes('steel')) return '#6366f1';
  if (target.includes('carpenter')) return '#d97706';
  if (target.includes('plumber')) return '#06b6d4';
  if (target.includes('electrician')) return '#eab308';
  if (target.includes('painter')) return '#ec4899';
  if (target.includes('welder')) return '#ef4444';
  if (target.includes('machine') || target.includes('operator')) return '#3b82f6';
  return '#64748b';
};

