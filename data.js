(function () {
  const KEYS = {
    users: 'pims_users', medicines: 'pims_medicines', batches: 'pims_batches',
    transactions: 'pims_transactions', settings: 'pims_settings', session: 'pims_session', audit: 'pims_audit'
  };

  const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Gel', 'Cream', 'Ointment', 'Vial', 'Ampoule', 'Drops'];
  const ROUTES = ['Oral', 'Topical', 'Injection', 'Ophthalmic', 'Otic', 'Nasal'];
  const STRENGTH_UNITS = ['mg', 'g', 'mcg', 'mg/mL', 'g/mL', 'IU/mL', '%', 'mg/g'];
  const SEED_VERSION_KEY = 'pims_seed_version';
  const CURRENT_SEED_VERSION = 2;

  function med(seed) {
    return {
      id: seed.id,
      code: seed.code,
      genericName: seed.genericName,
      brandName: seed.brandName,
      dosageForm: seed.dosageForm,
      route: seed.route,
      strengthValue: seed.strengthValue,
      strengthUnit: seed.strengthUnit,
      volumeValue: seed.volumeValue ?? null,
      volumeUnit: seed.volumeUnit ?? null,
      concentrationText: seed.concentrationText || '',
      packagingText: seed.packagingText,
      form: seed.dosageForm,
      strength: `${seed.strengthValue ?? ''}${seed.strengthUnit ? ` ${seed.strengthUnit}` : ''}`.trim(),
      category: seed.category,
      rxRequired: seed.rxRequired,
      shelfLocation: seed.shelfLocation,
      orderingUnit: 'Box',
      dispensingUnit: seed.baseUnit,
      baseUnit: seed.baseUnit,
      packSize: seed.packSize,
      reorderLevelBoxes: seed.reorderLevelBoxes,
      archived: false
    };
  }

  function seedMedicines() {
    return [
      med({ id:'m1', code:'PAR-500-T', genericName:'Paracetamol', brandName:'Biogesic', dosageForm:'Tablet', route:'Oral', strengthValue:500, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 tablets', baseUnit:'tablet', category:'Analgesic', rxRequired:false, shelfLocation:'A1', packSize:100, reorderLevelBoxes:5 }),
      med({ id:'m2', code:'IBU-200-T', genericName:'Ibuprofen', brandName:'Advil', dosageForm:'Tablet', route:'Oral', strengthValue:200, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 tablets', baseUnit:'tablet', category:'Analgesic', rxRequired:false, shelfLocation:'A2', packSize:100, reorderLevelBoxes:4 }),
      med({ id:'m3', code:'CET-10-T', genericName:'Cetirizine', brandName:'Zyrtec', dosageForm:'Tablet', route:'Oral', strengthValue:10, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 tablets', baseUnit:'tablet', category:'Antihistamine', rxRequired:false, shelfLocation:'A3', packSize:100, reorderLevelBoxes:3 }),
      med({ id:'m4', code:'LOR-10-T', genericName:'Loratadine', brandName:'Claritin', dosageForm:'Tablet', route:'Oral', strengthValue:10, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 tablets', baseUnit:'tablet', category:'Antihistamine', rxRequired:false, shelfLocation:'A4', packSize:100, reorderLevelBoxes:3 }),
      med({ id:'m5', code:'MET-500-T', genericName:'Metformin', brandName:'Glucophage', dosageForm:'Tablet', route:'Oral', strengthValue:500, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 60 tablets', baseUnit:'tablet', category:'Antidiabetic', rxRequired:true, shelfLocation:'A5', packSize:60, reorderLevelBoxes:5 }),
      med({ id:'m6', code:'AML-5-T', genericName:'Amlodipine', brandName:'Norvasc', dosageForm:'Tablet', route:'Oral', strengthValue:5, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 tablets', baseUnit:'tablet', category:'Antihypertensive', rxRequired:true, shelfLocation:'A6', packSize:100, reorderLevelBoxes:4 }),
      med({ id:'m7', code:'LOS-50-T', genericName:'Losartan', brandName:'Cozaar', dosageForm:'Tablet', route:'Oral', strengthValue:50, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 tablets', baseUnit:'tablet', category:'Antihypertensive', rxRequired:true, shelfLocation:'A7', packSize:100, reorderLevelBoxes:4 }),
      med({ id:'m8', code:'OME-20-C', genericName:'Omeprazole', brandName:'Losec', dosageForm:'Capsule', route:'Oral', strengthValue:20, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 capsules', baseUnit:'capsule', category:'Gastrointestinal', rxRequired:true, shelfLocation:'B1', packSize:100, reorderLevelBoxes:4 }),
      med({ id:'m9', code:'AMX-500-C', genericName:'Amoxicillin', brandName:'Amoxil', dosageForm:'Capsule', route:'Oral', strengthValue:500, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 capsules', baseUnit:'capsule', category:'Antibiotic', rxRequired:true, shelfLocation:'B2', packSize:100, reorderLevelBoxes:5 }),
      med({ id:'m10', code:'DOX-100-C', genericName:'Doxycycline', brandName:'Doryx', dosageForm:'Capsule', route:'Oral', strengthValue:100, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 100 capsules', baseUnit:'capsule', category:'Antibiotic', rxRequired:true, shelfLocation:'B3', packSize:100, reorderLevelBoxes:3 }),
      med({ id:'m11', code:'AZI-500-T', genericName:'Azithromycin', brandName:'Zithromax', dosageForm:'Tablet', route:'Oral', strengthValue:500, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 30 tablets', baseUnit:'tablet', category:'Antibiotic', rxRequired:true, shelfLocation:'B4', packSize:30, reorderLevelBoxes:4 }),
      med({ id:'m12', code:'LEV-500-T', genericName:'Levofloxacin', brandName:'Levaquin', dosageForm:'Tablet', route:'Oral', strengthValue:500, strengthUnit:'mg', volumeValue:null, packagingText:'Box of 50 tablets', baseUnit:'tablet', category:'Antibiotic', rxRequired:true, shelfLocation:'B5', packSize:50, reorderLevelBoxes:3 }),

      med({ id:'m13', code:'PAR-250-SY', genericName:'Paracetamol', brandName:'Calpol', dosageForm:'Syrup', route:'Oral', strengthValue:250, strengthUnit:'mg', concentrationText:'250mg/5mL', volumeValue:60, volumeUnit:'mL', packagingText:'Bottle 60mL', baseUnit:'mL', category:'Analgesic', rxRequired:false, shelfLocation:'C1', packSize:600, reorderLevelBoxes:3 }),
      med({ id:'m14', code:'IBU-100-SY', genericName:'Ibuprofen', brandName:'Brufen', dosageForm:'Syrup', route:'Oral', strengthValue:100, strengthUnit:'mg', concentrationText:'100mg/5mL', volumeValue:60, volumeUnit:'mL', packagingText:'Bottle 60mL', baseUnit:'mL', category:'Analgesic', rxRequired:false, shelfLocation:'C2', packSize:600, reorderLevelBoxes:3 }),
      med({ id:'m15', code:'AMX-250-SY', genericName:'Amoxicillin', brandName:'Amoxil Suspension', dosageForm:'Suspension', route:'Oral', strengthValue:250, strengthUnit:'mg', concentrationText:'250mg/5mL', volumeValue:60, volumeUnit:'mL', packagingText:'Bottle 60mL', baseUnit:'mL', category:'Antibiotic', rxRequired:true, shelfLocation:'C3', packSize:600, reorderLevelBoxes:4 }),
      med({ id:'m16', code:'COA-228-SY', genericName:'Co-amoxiclav', brandName:'Augmentin', dosageForm:'Suspension', route:'Oral', strengthValue:228, strengthUnit:'mg', concentrationText:'228mg/5mL', volumeValue:70, volumeUnit:'mL', packagingText:'Bottle 70mL', baseUnit:'mL', category:'Antibiotic', rxRequired:true, shelfLocation:'C4', packSize:700, reorderLevelBoxes:3 }),
      med({ id:'m17', code:'DPM-12-SY', genericName:'Diphenhydramine', brandName:'Benadryl', dosageForm:'Syrup', route:'Oral', strengthValue:12.5, strengthUnit:'mg', concentrationText:'12.5mg/5mL', volumeValue:120, volumeUnit:'mL', packagingText:'Bottle 120mL', baseUnit:'mL', category:'Antihistamine', rxRequired:false, shelfLocation:'C5', packSize:1200, reorderLevelBoxes:3 }),
      med({ id:'m18', code:'CTZ-5-SY', genericName:'Cetirizine', brandName:'Zyrtec Syrup', dosageForm:'Syrup', route:'Oral', strengthValue:5, strengthUnit:'mg', concentrationText:'5mg/5mL', volumeValue:60, volumeUnit:'mL', packagingText:'Bottle 60mL', baseUnit:'mL', category:'Antihistamine', rxRequired:false, shelfLocation:'C6', packSize:600, reorderLevelBoxes:2 }),
      med({ id:'m19', code:'SAL-2-SY', genericName:'Salbutamol', brandName:'Ventolin Syrup', dosageForm:'Syrup', route:'Oral', strengthValue:2, strengthUnit:'mg', concentrationText:'2mg/5mL', volumeValue:60, volumeUnit:'mL', packagingText:'Bottle 60mL', baseUnit:'mL', category:'Bronchodilator', rxRequired:true, shelfLocation:'C7', packSize:600, reorderLevelBoxes:2 }),
      med({ id:'m20', code:'MUL-200-SY', genericName:'Multivitamins', brandName:'Ceelin', dosageForm:'Syrup', route:'Oral', strengthValue:200, strengthUnit:'mg', concentrationText:'200mg/5mL', volumeValue:120, volumeUnit:'mL', packagingText:'Bottle 120mL', baseUnit:'mL', category:'Vitamins', rxRequired:false, shelfLocation:'C8', packSize:1200, reorderLevelBoxes:2 }),

      med({ id:'m21', code:'DIC-1-GE', genericName:'Diclofenac', brandName:'Voltaren Gel', dosageForm:'Gel', route:'Topical', strengthValue:1, strengthUnit:'%', packagingText:'Tube 20g', volumeValue:null, baseUnit:'g', category:'Analgesic Topical', rxRequired:false, shelfLocation:'D1', packSize:200, reorderLevelBoxes:3 }),
      med({ id:'m22', code:'MUP-2-CR', genericName:'Mupirocin', brandName:'Bactroban', dosageForm:'Cream', route:'Topical', strengthValue:2, strengthUnit:'%', packagingText:'Tube 15g', volumeValue:null, baseUnit:'g', category:'Dermatology', rxRequired:true, shelfLocation:'D2', packSize:150, reorderLevelBoxes:2 }),
      med({ id:'m23', code:'KET-2-CR', genericName:'Ketoconazole', brandName:'Nizoral Cream', dosageForm:'Cream', route:'Topical', strengthValue:2, strengthUnit:'%', packagingText:'Tube 20g', volumeValue:null, baseUnit:'g', category:'Antifungal', rxRequired:false, shelfLocation:'D3', packSize:200, reorderLevelBoxes:2 }),
      med({ id:'m24', code:'HYD-1-CR', genericName:'Hydrocortisone', brandName:'Cortaid', dosageForm:'Cream', route:'Topical', strengthValue:1, strengthUnit:'%', packagingText:'Tube 15g', volumeValue:null, baseUnit:'g', category:'Steroid', rxRequired:true, shelfLocation:'D4', packSize:150, reorderLevelBoxes:2 }),
      med({ id:'m25', code:'BET-0.1-ON', genericName:'Betamethasone', brandName:'Diprolene', dosageForm:'Ointment', route:'Topical', strengthValue:0.1, strengthUnit:'%', packagingText:'Tube 15g', volumeValue:null, baseUnit:'g', category:'Steroid', rxRequired:true, shelfLocation:'D5', packSize:150, reorderLevelBoxes:2 }),
      med({ id:'m26', code:'CLO-1-CR', genericName:'Clotrimazole', brandName:'Canesten', dosageForm:'Cream', route:'Topical', strengthValue:1, strengthUnit:'%', packagingText:'Tube 20g', volumeValue:null, baseUnit:'g', category:'Antifungal', rxRequired:false, shelfLocation:'D6', packSize:200, reorderLevelBoxes:2 }),
      med({ id:'m27', code:'ACY-5-CR', genericName:'Acyclovir', brandName:'Zovirax Cream', dosageForm:'Cream', route:'Topical', strengthValue:5, strengthUnit:'%', packagingText:'Tube 10g', volumeValue:null, baseUnit:'g', category:'Antiviral', rxRequired:true, shelfLocation:'D7', packSize:100, reorderLevelBoxes:2 }),
      med({ id:'m28', code:'FUS-2-CR', genericName:'Fusidic Acid', brandName:'Fucidin', dosageForm:'Cream', route:'Topical', strengthValue:2, strengthUnit:'%', packagingText:'Tube 15g', volumeValue:null, baseUnit:'g', category:'Antibiotic Topical', rxRequired:true, shelfLocation:'D8', packSize:150, reorderLevelBoxes:2 }),

      med({ id:'m29', code:'CTX-1G-VL', genericName:'Ceftriaxone', brandName:'Rocephin', dosageForm:'Vial', route:'Injection', strengthValue:1000, strengthUnit:'mg/mL', volumeValue:10, volumeUnit:'mL', concentrationText:'1g vial', packagingText:'Box of 10 vials', baseUnit:'mL', category:'Antibiotic Injectable', rxRequired:true, shelfLocation:'E1', packSize:100, reorderLevelBoxes:3 }),
      med({ id:'m30', code:'MET-500-VL', genericName:'Metronidazole', brandName:'Flagyl IV', dosageForm:'Vial', route:'Injection', strengthValue:5, strengthUnit:'mg/mL', volumeValue:100, volumeUnit:'mL', concentrationText:'500mg/100mL', packagingText:'Box of 10 vials', baseUnit:'mL', category:'Antibiotic Injectable', rxRequired:true, shelfLocation:'E2', packSize:1000, reorderLevelBoxes:2 }),
      med({ id:'m31', code:'OMZ-40-VL', genericName:'Omeprazole', brandName:'Omepro IV', dosageForm:'Vial', route:'Injection', strengthValue:40, strengthUnit:'mg/mL', volumeValue:10, volumeUnit:'mL', concentrationText:'40mg vial', packagingText:'Box of 10 vials', baseUnit:'mL', category:'Gastrointestinal Injectable', rxRequired:true, shelfLocation:'E3', packSize:100, reorderLevelBoxes:2 }),
      med({ id:'m32', code:'DEX-4-AP', genericName:'Dexamethasone', brandName:'Dexa IV', dosageForm:'Ampoule', route:'Injection', strengthValue:4, strengthUnit:'mg/mL', volumeValue:1, volumeUnit:'mL', concentrationText:'4mg/mL', packagingText:'Box of 25 ampoules', baseUnit:'mL', category:'Steroid Injectable', rxRequired:true, shelfLocation:'E4', packSize:25, reorderLevelBoxes:3 }),
      med({ id:'m33', code:'ADR-1-AP', genericName:'Adrenaline', brandName:'Epi', dosageForm:'Ampoule', route:'Injection', strengthValue:1, strengthUnit:'mg/mL', volumeValue:1, volumeUnit:'mL', concentrationText:'1mg/mL', packagingText:'Box of 10 ampoules', baseUnit:'mL', category:'Emergency Injectable', rxRequired:true, shelfLocation:'E5', packSize:10, reorderLevelBoxes:3 }),
      med({ id:'m34', code:'INS-100-VL', genericName:'Insulin Regular', brandName:'Humulin R', dosageForm:'Vial', route:'Injection', strengthValue:100, strengthUnit:'IU/mL', volumeValue:10, volumeUnit:'mL', concentrationText:'100IU/mL', packagingText:'Box of 5 vials', baseUnit:'mL', category:'Antidiabetic Injectable', rxRequired:true, shelfLocation:'E6', packSize:50, reorderLevelBoxes:3 }),
      med({ id:'m35', code:'CEF-1.5-VL', genericName:'Cefuroxime', brandName:'Zinacef', dosageForm:'Vial', route:'Injection', strengthValue:1500, strengthUnit:'mg/mL', volumeValue:10, volumeUnit:'mL', concentrationText:'1.5g vial', packagingText:'Box of 10 vials', baseUnit:'mL', category:'Antibiotic Injectable', rxRequired:true, shelfLocation:'E7', packSize:100, reorderLevelBoxes:2 }),
      med({ id:'m36', code:'RAN-50-AP', genericName:'Ranitidine', brandName:'Zantac Injection', dosageForm:'Ampoule', route:'Injection', strengthValue:25, strengthUnit:'mg/mL', volumeValue:2, volumeUnit:'mL', concentrationText:'50mg/2mL', packagingText:'Box of 10 ampoules', baseUnit:'mL', category:'Gastrointestinal Injectable', rxRequired:true, shelfLocation:'E8', packSize:20, reorderLevelBoxes:3 })
    ];
  }

  function seedBatches(medicines) {
    const batches = [];
    const today = new Date();
    const addDays = (n) => new Date(today.getTime() + n * 86400000).toISOString().slice(0, 10);

    medicines.forEach((m, idx) => {
      const firstQty = Math.round(m.packSize * (0.8 + (idx % 3) * 0.35));
      const secondQty = Math.round(m.packSize * (1 + (idx % 4) * 0.4));
      const thirdQty = Math.round(m.packSize * 0.7);

      batches.push({ id: `b_${m.id}_1`, medicineId: m.id, batchNo: `${m.code.replace(/[^A-Z0-9]/g, '').slice(0,6)}-A`, expiryDate: addDays(25 + (idx % 6) * 10), qtyBaseUnits: firstQty });
      batches.push({ id: `b_${m.id}_2`, medicineId: m.id, batchNo: `${m.code.replace(/[^A-Z0-9]/g, '').slice(0,6)}-B`, expiryDate: addDays(95 + (idx % 5) * 18), qtyBaseUnits: secondQty });
      if (idx % 4 === 0) {
        batches.push({ id: `b_${m.id}_3`, medicineId: m.id, batchNo: `${m.code.replace(/[^A-Z0-9]/g, '').slice(0,6)}-X`, expiryDate: addDays(-5 - (idx % 3)), qtyBaseUnits: thirdQty });
      }
    });

    return batches;
  }

  function seed() {
    const users = [
      { id: 'u1', username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', status: 'active', lastLogin: null },
      { id: 'u2', username: 'staff', password: 'staff123', role: 'staff', name: 'Staff User', status: 'active', lastLogin: null }
    ];

    const medicines = seedMedicines();
    const batches = seedBatches(medicines);

    const settings = {
      warningDays: 60,
      requireRxVerification: true,
      categories: [...new Set(medicines.map(m => m.category))],
      dosageForms: DOSAGE_FORMS,
      routes: ROUTES,
      strengthUnits: STRENGTH_UNITS
    };

    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.medicines, JSON.stringify(medicines));
    localStorage.setItem(KEYS.batches, JSON.stringify(batches));
    localStorage.setItem(KEYS.transactions, JSON.stringify([]));
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
    localStorage.setItem(KEYS.session, JSON.stringify(null));
    localStorage.setItem(KEYS.audit, JSON.stringify([]));
    localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION));
  }

  function needsMigration() {
    const version = Number(localStorage.getItem(SEED_VERSION_KEY) || 0);
    if (version < CURRENT_SEED_VERSION) return true;

    const meds = JSON.parse(localStorage.getItem(KEYS.medicines) || '[]');
    if (!Array.isArray(meds) || meds.length < 35) return true;

    const hasNewFields = meds.every(m => m && m.dosageForm && m.baseUnit && Object.prototype.hasOwnProperty.call(m, 'strengthValue') && Object.prototype.hasOwnProperty.call(m, 'packagingText'));
    return !hasNewFields;
  }

  window.PIMS_DATA = {
    KEYS,
    initPIMSData() {
      if (!localStorage.getItem(KEYS.users) || needsMigration()) seed();
    }
  };
})();
