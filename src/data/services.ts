// Real e-Sevai service data based on Tamil Nadu e-Sevai centre boards

export interface ServiceCategory {
  id: string;
  name: string;
  nameHindi?: string;
  icon: string;
  description: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  nameRegional?: string;
  categoryId: string;
  department: string;
  description: string;
  price: number;
  processingTime: string;
  requiredDocuments: string[];
  popular?: boolean;
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: "revenue",
    name: "Revenue Department",
    icon: "FileText",
    description: "Land records, patta, encumbrance certificates"
  },
  {
    id: "certificates",
    name: "Certificates",
    icon: "Award",
    description: "Community, nativity, income, and other certificates"
  },
  {
    id: "aadhaar",
    name: "Aadhaar Services",
    icon: "CreditCard",
    description: "Aadhaar update, enrollment, and correction services"
  },
  {
    id: "pension",
    name: "Pension Schemes",
    icon: "Wallet",
    description: "Old age, widow, and disability pension applications"
  },
  {
    id: "utility",
    name: "Utility Payments",
    icon: "Zap",
    description: "EB, water, property tax payments"
  },
  {
    id: "vital-records",
    name: "Vital Records",
    icon: "Heart",
    description: "Birth and death certificate services"
  },
  {
    id: "education",
    name: "Education Services",
    icon: "GraduationCap",
    description: "TNEA, scholarship, and academic services"
  },
  {
    id: "business",
    name: "Business & Trade",
    icon: "Briefcase",
    description: "Professional tax, trade license, GST services"
  },
  {
    id: "misc",
    name: "Other Services",
    icon: "MoreHorizontal",
    description: "Miscellaneous government services"
  }
];

export const services: Service[] = [
  // Revenue Department
  {
    id: "patta-copy",
    code: "REV001",
    name: "Patta Copy",
    categoryId: "revenue",
    department: "Revenue Department",
    description: "Get a certified copy of your land patta document",
    price: 60,
    processingTime: "2-3 days",
    requiredDocuments: ["Aadhaar Card", "Survey Number", "Previous Patta (if available)"],
    popular: true
  },
  {
    id: "encumbrance-certificate",
    code: "REV002",
    name: "Encumbrance Certificate (EC)",
    categoryId: "revenue",
    department: "Revenue Department",
    description: "Certificate showing property transaction history",
    price: 120,
    processingTime: "3-5 days",
    requiredDocuments: ["Property Documents", "Aadhaar Card", "Survey Number"],
    popular: true
  },
  {
    id: "chitta-copy",
    code: "REV003",
    name: "Chitta Copy",
    categoryId: "revenue",
    department: "Revenue Department",
    description: "Revenue record showing land classification and ownership",
    price: 60,
    processingTime: "2-3 days",
    requiredDocuments: ["Aadhaar Card", "Survey Number"]
  },
  {
    id: "adangal",
    code: "REV004",
    name: "Adangal Extract",
    categoryId: "revenue",
    department: "Revenue Department",
    description: "Village account extract for agricultural land",
    price: 30,
    processingTime: "1-2 days",
    requiredDocuments: ["Aadhaar Card", "Survey Number"]
  },
  {
    id: "legal-heir",
    code: "REV005",
    name: "Legal Heir Certificate",
    categoryId: "revenue",
    department: "Revenue Department",
    description: "Certificate establishing legal heirs of deceased person",
    price: 120,
    processingTime: "7-15 days",
    requiredDocuments: ["Death Certificate", "Family Members Aadhaar", "Ration Card"]
  },

  // Certificates
  {
    id: "community-certificate",
    code: "CERT001",
    name: "Community Certificate",
    categoryId: "certificates",
    department: "Revenue Department",
    description: "Certificate proving community/caste for reservations",
    price: 60,
    processingTime: "7-10 days",
    requiredDocuments: ["Aadhaar Card", "Parent's Community Certificate", "School Certificate"],
    popular: true
  },
  {
    id: "nativity-certificate",
    code: "CERT002",
    name: "Nativity Certificate",
    categoryId: "certificates",
    department: "Revenue Department",
    description: "Certificate proving place of birth/residence",
    price: 60,
    processingTime: "5-7 days",
    requiredDocuments: ["Aadhaar Card", "Birth Certificate", "Ration Card"]
  },
  {
    id: "income-certificate",
    code: "CERT003",
    name: "Income Certificate",
    categoryId: "certificates",
    department: "Revenue Department",
    description: "Certificate stating annual family income",
    price: 60,
    processingTime: "5-7 days",
    requiredDocuments: ["Aadhaar Card", "Salary Slip/Self Declaration", "Ration Card"],
    popular: true
  },
  {
    id: "obc-certificate",
    code: "CERT004",
    name: "OBC Certificate",
    categoryId: "certificates",
    department: "Revenue Department",
    description: "Other Backward Class certificate",
    price: 60,
    processingTime: "7-10 days",
    requiredDocuments: ["Aadhaar Card", "Community Certificate", "Income Certificate"]
  },
  {
    id: "residence-certificate",
    code: "CERT005",
    name: "Residence Certificate",
    categoryId: "certificates",
    department: "Revenue Department",
    description: "Proof of residence in a particular area",
    price: 30,
    processingTime: "3-5 days",
    requiredDocuments: ["Aadhaar Card", "Ration Card", "EB Bill"]
  },
  {
    id: "first-graduate",
    code: "CERT006",
    name: "First Graduate Certificate",
    categoryId: "certificates",
    department: "Revenue Department",
    description: "Certificate for first graduate in family",
    price: 60,
    processingTime: "5-7 days",
    requiredDocuments: ["Aadhaar Card", "Parent Education Proof", "Degree Certificate"]
  },

  // Aadhaar Services
  {
    id: "aadhaar-address-update",
    code: "AAD001",
    name: "Aadhaar Address Update",
    categoryId: "aadhaar",
    department: "UIDAI",
    description: "Update your address in Aadhaar card",
    price: 50,
    processingTime: "15-30 days",
    requiredDocuments: ["Current Aadhaar", "Address Proof"],
    popular: true
  },
  {
    id: "aadhaar-mobile-update",
    code: "AAD002",
    name: "Aadhaar Mobile Update",
    categoryId: "aadhaar",
    department: "UIDAI",
    description: "Link or update mobile number in Aadhaar",
    price: 50,
    processingTime: "Same day",
    requiredDocuments: ["Current Aadhaar", "Working Mobile Number"]
  },
  {
    id: "aadhaar-name-correction",
    code: "AAD003",
    name: "Aadhaar Name Correction",
    categoryId: "aadhaar",
    department: "UIDAI",
    description: "Correct spelling or update name in Aadhaar",
    price: 50,
    processingTime: "15-30 days",
    requiredDocuments: ["Current Aadhaar", "Name Proof Document"]
  },
  {
    id: "aadhaar-dob-update",
    code: "AAD004",
    name: "Aadhaar DOB Update",
    categoryId: "aadhaar",
    department: "UIDAI",
    description: "Update date of birth in Aadhaar",
    price: 50,
    processingTime: "15-30 days",
    requiredDocuments: ["Current Aadhaar", "Birth Certificate/School Certificate"]
  },
  {
    id: "aadhaar-biometric-update",
    code: "AAD005",
    name: "Aadhaar Biometric Update",
    categoryId: "aadhaar",
    department: "UIDAI",
    description: "Update fingerprints and photo in Aadhaar",
    price: 100,
    processingTime: "15-30 days",
    requiredDocuments: ["Current Aadhaar", "Personal Visit Required"]
  },

  // Pension Schemes
  {
    id: "old-age-pension",
    code: "PEN001",
    name: "Old Age Pension",
    categoryId: "pension",
    department: "Social Welfare Department",
    description: "Monthly pension for senior citizens above 60",
    price: 120,
    processingTime: "30-45 days",
    requiredDocuments: ["Aadhaar Card", "Age Proof", "Bank Passbook", "Ration Card"],
    popular: true
  },
  {
    id: "widow-pension",
    code: "PEN002",
    name: "Widow Pension",
    categoryId: "pension",
    department: "Social Welfare Department",
    description: "Monthly pension for widows",
    price: 120,
    processingTime: "30-45 days",
    requiredDocuments: ["Aadhaar Card", "Husband's Death Certificate", "Bank Passbook"]
  },
  {
    id: "disability-pension",
    code: "PEN003",
    name: "Disability Pension",
    categoryId: "pension",
    department: "Social Welfare Department",
    description: "Monthly pension for differently abled persons",
    price: 120,
    processingTime: "30-45 days",
    requiredDocuments: ["Aadhaar Card", "Disability Certificate", "Bank Passbook"]
  },

  // Utility Payments
  {
    id: "eb-bill-payment",
    code: "UTIL001",
    name: "EB Bill Payment",
    categoryId: "utility",
    department: "TANGEDCO",
    description: "Pay your electricity bill",
    price: 10,
    processingTime: "Instant",
    requiredDocuments: ["Consumer Number", "EB Bill"],
    popular: true
  },
  {
    id: "water-bill-payment",
    code: "UTIL002",
    name: "Water Bill Payment",
    categoryId: "utility",
    department: "TWAD Board",
    description: "Pay your water tax bill",
    price: 10,
    processingTime: "Instant",
    requiredDocuments: ["Connection Number", "Water Bill"]
  },
  {
    id: "property-tax",
    code: "UTIL003",
    name: "Property Tax Payment",
    categoryId: "utility",
    department: "Corporation/Municipality",
    description: "Pay your property tax online",
    price: 20,
    processingTime: "Instant",
    requiredDocuments: ["Property Tax Number", "Previous Receipt"]
  },

  // Vital Records
  {
    id: "birth-certificate",
    code: "VIT001",
    name: "Birth Certificate",
    categoryId: "vital-records",
    department: "Corporation/Municipality",
    description: "Apply for birth certificate",
    price: 60,
    processingTime: "7-15 days",
    requiredDocuments: ["Hospital Discharge Summary", "Parent Aadhaar", "Marriage Certificate"],
    popular: true
  },
  {
    id: "death-certificate",
    code: "VIT002",
    name: "Death Certificate",
    categoryId: "vital-records",
    department: "Corporation/Municipality",
    description: "Apply for death certificate",
    price: 60,
    processingTime: "7-15 days",
    requiredDocuments: ["Hospital Records", "Aadhaar of Deceased", "Aadhaar of Applicant"]
  },
  {
    id: "birth-cert-correction",
    code: "VIT003",
    name: "Birth Certificate Correction",
    categoryId: "vital-records",
    department: "Corporation/Municipality",
    description: "Correct details in existing birth certificate",
    price: 100,
    processingTime: "15-30 days",
    requiredDocuments: ["Original Birth Certificate", "Proof Documents", "Affidavit"]
  },

  // Education Services
  {
    id: "tnea-application",
    code: "EDU001",
    name: "TNEA Application",
    categoryId: "education",
    department: "DOTE",
    description: "Engineering admission counselling application",
    price: 150,
    processingTime: "During counselling",
    requiredDocuments: ["12th Marksheet", "Community Certificate", "Income Certificate"],
    popular: true
  },
  {
    id: "scholarship-application",
    code: "EDU002",
    name: "Scholarship Application",
    categoryId: "education",
    department: "BC/MBC Welfare",
    description: "Apply for government scholarships",
    price: 60,
    processingTime: "30-45 days",
    requiredDocuments: ["College ID", "Marksheet", "Income Certificate", "Community Certificate"]
  },
  {
    id: "transfer-certificate",
    code: "EDU003",
    name: "Transfer Certificate",
    categoryId: "education",
    department: "School Education",
    description: "Apply for school transfer certificate",
    price: 50,
    processingTime: "3-5 days",
    requiredDocuments: ["School ID", "Previous TC", "Fee Receipt"]
  },

  // Business & Trade
  {
    id: "professional-tax",
    code: "BUS001",
    name: "Professional Tax Registration",
    categoryId: "business",
    department: "Commercial Tax",
    description: "Register for professional tax",
    price: 150,
    processingTime: "7-10 days",
    requiredDocuments: ["Business Proof", "Aadhaar", "PAN Card"],
    popular: true
  },
  {
    id: "trade-license",
    code: "BUS002",
    name: "Trade License Application",
    categoryId: "business",
    department: "Corporation/Municipality",
    description: "Apply for new trade license",
    price: 200,
    processingTime: "15-30 days",
    requiredDocuments: ["Business Proof", "Rental Agreement", "Aadhaar", "Photos"]
  },
  {
    id: "gst-registration",
    code: "BUS003",
    name: "GST Registration",
    categoryId: "business",
    department: "GST Department",
    description: "Register for GST number",
    price: 500,
    processingTime: "7-15 days",
    requiredDocuments: ["PAN Card", "Aadhaar", "Business Proof", "Bank Statement"]
  },
  {
    id: "fssai-license",
    code: "BUS004",
    name: "FSSAI License",
    categoryId: "business",
    department: "Food Safety",
    description: "Food safety license for food business",
    price: 300,
    processingTime: "15-30 days",
    requiredDocuments: ["Business Proof", "Aadhaar", "Photos", "Food Sample"]
  },

  // Miscellaneous
  {
    id: "driving-license",
    code: "MISC001",
    name: "Driving License Application",
    categoryId: "misc",
    department: "RTO",
    description: "Apply for new driving license",
    price: 200,
    processingTime: "15-30 days",
    requiredDocuments: ["Age Proof", "Address Proof", "Photos", "LLR"],
    popular: true
  },
  {
    id: "passport-assistance",
    code: "MISC002",
    name: "Passport Application Assistance",
    categoryId: "misc",
    department: "Passport Seva",
    description: "Help with passport application form filling",
    price: 150,
    processingTime: "Assistance only",
    requiredDocuments: ["Aadhaar", "PAN Card", "Address Proof", "Photos"]
  },
  {
    id: "voter-id-new",
    code: "MISC003",
    name: "New Voter ID Application",
    categoryId: "misc",
    department: "Election Commission",
    description: "Apply for new voter ID card",
    price: 50,
    processingTime: "30-45 days",
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Photo"]
  },
  {
    id: "voter-id-correction",
    code: "MISC004",
    name: "Voter ID Correction",
    categoryId: "misc",
    department: "Election Commission",
    description: "Correct details in voter ID",
    price: 50,
    processingTime: "15-30 days",
    requiredDocuments: ["Current Voter ID", "Proof Documents"]
  },
  {
    id: "ration-card-new",
    code: "MISC005",
    name: "New Ration Card",
    categoryId: "misc",
    department: "Civil Supplies",
    description: "Apply for new ration card",
    price: 100,
    processingTime: "30-45 days",
    requiredDocuments: ["Aadhaar Card", "Address Proof", "Income Certificate", "Gas Connection Proof"]
  },
  {
    id: "pan-card-new",
    code: "MISC006",
    name: "New PAN Card",
    categoryId: "misc",
    department: "Income Tax",
    description: "Apply for new PAN card",
    price: 150,
    processingTime: "15-20 days",
    requiredDocuments: ["Aadhaar Card", "Photo", "Signature"],
    popular: true
  },
  {
    id: "pan-card-correction",
    code: "MISC007",
    name: "PAN Card Correction",
    categoryId: "misc",
    department: "Income Tax",
    description: "Correct details in PAN card",
    price: 150,
    processingTime: "15-20 days",
    requiredDocuments: ["Current PAN", "Aadhaar", "Proof Documents"]
  }
];

// Helper functions
export const getServicesByCategory = (categoryId: string): Service[] => {
  return services.filter(service => service.categoryId === categoryId);
};

export const getServiceById = (serviceId: string): Service | undefined => {
  return services.find(service => service.id === serviceId);
};

export const getPopularServices = (): Service[] => {
  return services.filter(service => service.popular);
};

export const searchServices = (query: string): Service[] => {
  const lowerQuery = query.toLowerCase();
  return services.filter(
    service =>
      service.name.toLowerCase().includes(lowerQuery) ||
      service.code.toLowerCase().includes(lowerQuery) ||
      service.description.toLowerCase().includes(lowerQuery) ||
      service.department.toLowerCase().includes(lowerQuery)
  );
};

export const getCategoryById = (categoryId: string): ServiceCategory | undefined => {
  return serviceCategories.find(cat => cat.id === categoryId);
};
