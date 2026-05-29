import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  INITIAL_PATIENTS, INITIAL_QUEUE, INITIAL_PRESCRIPTIONS,
  INITIAL_INVENTORY, INITIAL_INQUIRIES, INITIAL_SCANS,
  INITIAL_LAB_ORDERS, INITIAL_NOTIFICATIONS, INITIAL_MEDICAL_RECORDS,
  INITIAL_APPOINTMENTS, INITIAL_INVOICES, INITIAL_ORGANIZATIONS,
  translations,
} from '../constants';
import { db, auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  limit, 
  getDocs 
} from 'firebase/firestore';

// ─── Default Users ────────────────────────────────────────────────────────────
const INITIAL_USERS = [
  {
    email: 'ortho@clinic.com',
    name: 'Dr. Ahmed Ali',
    nameAr: 'د. أحمد علي',
    password: 'password',
    role: 'doctor',
    specialty: 'orthopedics',
    organizationId: 'clinic_ortho_helio',
  },
  {
    email: 'cardio@clinic.com',
    name: 'Dr. Yasser Nasr',
    nameAr: 'د. ياسر نصر',
    password: 'password',
    role: 'doctor',
    specialty: 'cardiology',
    organizationId: 'clinic_cardio_nasr',
  },
  {
    email: 'pedia@clinic.com',
    name: 'Dr. Rania Maadi',
    nameAr: 'د. رانيا المعادي',
    password: 'password',
    role: 'doctor',
    specialty: 'pediatrics',
    organizationId: 'clinic_pedia_maadi',
  },
  {
    email: 'reception@clinic.com',
    name: 'Receptionist Staff',
    nameAr: 'موظف الاستقبال',
    password: 'password',
    role: 'receptionist',
    organizationId: 'clinic_ortho_helio',
  },
  {
    email: 'pharmacy@clinic.com',
    name: 'Care Plus Pharmacist',
    nameAr: 'صيدلي كير بلس',
    password: 'password',
    role: 'pharmacy',
    organizationId: 'pharmacy_care_plus',
  },
  {
    email: 'lab@clinic.com',
    name: 'Alpha Lab Tech',
    nameAr: 'فني معمل ألفا',
    password: 'password',
    role: 'radiology',
    organizationId: 'lab_alpha',
  },
  {
    email: 'manager@clinic.com',
    name: 'Clinic Manager',
    nameAr: 'المدير التنفيذي',
    password: 'password',
    role: 'manager',
    organizationId: 'clinic_ortho_helio',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function usePersist(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch { return initialValue; }
  });
  const set = useCallback((value) => {
    setState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [state, set];
}

const DEFAULT_CLINIC_ORG_ID = 'clinic_ortho_helio';
const DEFAULT_PHARMACY_ORG_ID = 'pharmacy_care_plus';
const DEFAULT_LAB_ORG_ID = 'lab_alpha';
const DEFAULT_RADIOLOGY_ORG_ID = 'radiology_scan_house';

function getDefaultOrganizationId(role = 'doctor', specialty = 'orthopedics', organizations = INITIAL_ORGANIZATIONS) {
  if (role === 'pharmacy') return DEFAULT_PHARMACY_ORG_ID;
  if (role === 'radiology') return DEFAULT_LAB_ORG_ID;
  if (role === 'doctor') {
    return organizations.find(org => org.type === 'clinic' && org.specialty === specialty)?.id || DEFAULT_CLINIC_ORG_ID;
  }
  if (role === 'manager') return DEFAULT_CLINIC_ORG_ID;
  if (role === 'patient') return DEFAULT_CLINIC_ORG_ID;
  return DEFAULT_CLINIC_ORG_ID;
}

function scopeItem(item, fallbackOrganizationId) {
  return item.organizationId ? item : { ...item, organizationId: fallbackOrganizationId };
}

function scopePrescription(rx) {
  return {
    ...rx,
    sourceOrganizationId: rx.sourceOrganizationId || DEFAULT_CLINIC_ORG_ID,
    targetOrganizationId: rx.targetOrganizationId || DEFAULT_PHARMACY_ORG_ID,
    organizationId: rx.organizationId || rx.targetOrganizationId || DEFAULT_PHARMACY_ORG_ID,
  };
}

function scopeLabOrder(order) {
  return {
    ...order,
    sourceOrganizationId: order.sourceOrganizationId || DEFAULT_CLINIC_ORG_ID,
    targetOrganizationId: order.targetOrganizationId || DEFAULT_LAB_ORG_ID,
    organizationId: order.organizationId || order.targetOrganizationId || DEFAULT_LAB_ORG_ID,
  };
}

function scopeInquiry(inquiry) {
  return {
    ...inquiry,
    sourceOrganizationId: inquiry.sourceOrganizationId || DEFAULT_PHARMACY_ORG_ID,
    targetOrganizationId: inquiry.targetOrganizationId || DEFAULT_CLINIC_ORG_ID,
    organizationId: inquiry.organizationId || DEFAULT_PHARMACY_ORG_ID,
  };
}

function scopeScan(scan) {
  return {
    ...scan,
    sourceOrganizationId: scan.sourceOrganizationId || DEFAULT_RADIOLOGY_ORG_ID,
    targetOrganizationId: scan.targetOrganizationId || DEFAULT_CLINIC_ORG_ID,
    organizationId: scan.organizationId || DEFAULT_RADIOLOGY_ORG_ID,
  };
}

function scopeInvoice(invoice) {
  return {
    ...invoice,
    organizationId: invoice.organizationId || DEFAULT_PHARMACY_ORG_ID,
    source: invoice.source || (invoice.prescriptionId ? 'prescription' : 'pharmacy_pos'),
  };
}

function scopeNotification(notif) {
  const recipientOrg =
    notif.organizationId ||
    notif.targetOrganizationId ||
    (notif.recipient === 'pharmacy' ? DEFAULT_PHARMACY_ORG_ID
      : notif.recipient === 'radiology' ? DEFAULT_LAB_ORG_ID
      : DEFAULT_CLINIC_ORG_ID);
  return { ...notif, organizationId: recipientOrg };
}

function recordBelongsToOrganization(item, organizationId) {
  return item.organizationId === organizationId ||
    item.sourceOrganizationId === organizationId ||
    item.targetOrganizationId === organizationId;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  // Auth (with usePersist to keep local session fallback)
  const [isLoggedIn,  setIsLoggedIn]  = usePersist('clinic_is_logged_in', false);
  const [role,        setRole]        = usePersist('clinic_role', 'doctor');
  const [specialty,   setSpecialty]   = usePersist('clinic_specialty', 'orthopedics');
  const [loggedUser,  setLoggedUser]  = usePersist('clinic_logged_user', null);   // { name, nameAr, patientId? }
  const [organizations, setOrganizations] = usePersist('clinic_organizations', INITIAL_ORGANIZATIONS);
  const [currentOrganizationId, setCurrentOrganizationId] = usePersist('clinic_current_organization', DEFAULT_CLINIC_ORG_ID);
  const [allUsers, setUsers]          = usePersist('clinic_users', INITIAL_USERS);
  const [recordRequests, setRecordRequests] = usePersist('clinic_record_requests', []);

  // UI
  const [lang,        setLang]        = usePersist('clinic_lang', 'ar');
  const [isMenuOpen,  setIsMenuOpen]  = useState(false);
  const [theme,       setTheme]       = usePersist('clinic_theme', 'dark');
  const [activePage,  setActivePage]  = usePersist('clinic_active_page', 'home');

  // React State for all datasets (synced from Firestore or loaded from localStorage fallback)
  const [allPatients,       setPatients]         = usePersist('clinic_patients',         INITIAL_PATIENTS);
  const [allQueue,          setQueue]            = usePersist('clinic_queue',             INITIAL_QUEUE);
  const [allPrescriptions,  setPrescriptions]    = usePersist('clinic_prescriptions',     INITIAL_PRESCRIPTIONS);
  const [allInventory,      setInventory]        = usePersist('clinic_inventory',         INITIAL_INVENTORY);
  const [allInquiries,      setInquiries]        = usePersist('clinic_inquiries',         INITIAL_INQUIRIES);
  const [allScans,          setScans]            = usePersist('clinic_scans',             INITIAL_SCANS);
  const [allLabOrders,      setLabOrders]        = usePersist('clinic_lab_orders',        INITIAL_LAB_ORDERS);
  const [allNotifications,  setNotifications]    = usePersist('clinic_notifications',     INITIAL_NOTIFICATIONS);
  const [allMedicalRecords, setMedicalRecords]   = usePersist('clinic_medical_records',   INITIAL_MEDICAL_RECORDS);
  const [allAppointments,   setAppointments]     = usePersist('clinic_appointments',      INITIAL_APPOINTMENTS);
  const [allInvoices,       setInvoices]         = usePersist('clinic_invoices',          INITIAL_INVOICES);

  // Firestore Live Mapped Subscriptions
  useEffect(() => {
    if (!db) return;

    const unsubscribes = [
      onSnapshot(collection(db, 'patients'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setPatients(list);
      }, err => console.error('patients sync error:', err)),

      onSnapshot(collection(db, 'queue'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setQueue(list);
      }, err => console.error('queue sync error:', err)),

      onSnapshot(collection(db, 'prescriptions'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        // Sort by timestamp or Date.now desc if available
        setPrescriptions(list.sort((a, b) => (b.id - a.id)));
      }, err => console.error('prescriptions sync error:', err)),

      onSnapshot(collection(db, 'inventory'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setInventory(list);
      }, err => console.error('inventory sync error:', err)),

      onSnapshot(collection(db, 'inquiries'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setInquiries(list.sort((a, b) => b.id - a.id));
      }, err => console.error('inquiries sync error:', err)),

      onSnapshot(collection(db, 'scans'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setScans(list.sort((a, b) => b.id - a.id));
      }, err => console.error('scans sync error:', err)),

      onSnapshot(collection(db, 'lab_orders'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setLabOrders(list.sort((a, b) => b.id - a.id));
      }, err => console.error('lab_orders sync error:', err)),

      onSnapshot(collection(db, 'notifications'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setNotifications(list.sort((a, b) => b.id - a.id));
      }, err => console.error('notifications sync error:', err)),

      onSnapshot(collection(db, 'appointments'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setAppointments(list.sort((a, b) => b.id - a.id));
      }, err => console.error('appointments sync error:', err)),

      onSnapshot(collection(db, 'invoices'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setInvoices(list.sort((a, b) => b.id - a.id));
      }, err => console.error('invoices sync error:', err)),

      onSnapshot(collection(db, 'medical_records'), (snap) => {
        const records = {};
        snap.forEach(doc => {
          records[doc.id] = { ...doc.data(), patientId: doc.id };
        });
        setMedicalRecords(records);
      }, err => console.error('medical_records sync error:', err)),

      onSnapshot(collection(db, 'organizations'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        if (list.length > 0) setOrganizations(list);
      }, err => console.error('organizations sync error:', err)),

      onSnapshot(collection(db, 'record_requests'), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ ...doc.data(), id: doc.id }));
        setRecordRequests(list.sort((a, b) => b.id - a.id));
      }, err => console.error('record_requests sync error:', err)),
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db]);

  // Auth Listener to restore sessions on refresh
  useEffect(() => {
    if (!auth || !db) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data();
            setRole(profile.role);
            setCurrentOrganizationId(profile.organizationId);
            if (profile.specialty) setSpecialty(profile.specialty);
            setLoggedUser(profile);
            setIsLoggedIn(true);
          }
        } catch (e) {
          console.error('Session restore error:', e);
        }
      }
    });
    return unsubscribe;
  }, [auth, db]);

  // Auto Seeding Database
  const seedDatabase = useCallback(async () => {
    if (!db) return;
    try {
      console.log('Seeding INITIAL database to Cloud Firestore...');
      
      // Seed organizations
      for (const org of INITIAL_ORGANIZATIONS) {
        await setDoc(doc(db, 'organizations', org.id), org);
      }
      
      // Seed patients
      for (const p of INITIAL_PATIENTS) {
        await setDoc(doc(db, 'patients', String(p.id)), p);
      }
      
      // Seed medical records
      for (const [id, rec] of Object.entries(INITIAL_MEDICAL_RECORDS)) {
        await setDoc(doc(db, 'medical_records', String(id)), rec);
      }
      
      // Seed inventory
      for (const item of INITIAL_INVENTORY) {
        const invId = `INV_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        await setDoc(doc(db, 'inventory', invId), item);
      }
      
      // Seed prescriptions
      for (const rx of INITIAL_PRESCRIPTIONS) {
        await setDoc(doc(db, 'prescriptions', String(rx.id)), rx);
      }
      
      // Seed scans
      for (const sc of INITIAL_SCANS) {
        await setDoc(doc(db, 'scans', String(sc.id)), sc);
      }
      
      // Seed lab orders
      for (const order of INITIAL_LAB_ORDERS) {
        await setDoc(doc(db, 'lab_orders', String(order.id)), order);
      }
      
      // Seed appointments
      for (const a of INITIAL_APPOINTMENTS) {
        await setDoc(doc(db, 'appointments', String(a.id)), a);
      }
      
      // Seed invoices
      for (const inv of INITIAL_INVOICES) {
        await setDoc(doc(db, 'invoices', String(inv.id)), inv);
      }
      
      console.log('Firebase Seeding completed.');
    } catch (e) {
      console.error('Database seeding failed:', e);
    }
  }, [db]);

  // Check if seeding is required
  useEffect(() => {
    if (!db) return;
    const checkAndSeed = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'patients'), limit(1)));
        if (snap.empty) {
          await seedDatabase();
        }
      } catch (err) {
        console.error('Check database empty state error:', err);
      }
    };
    checkAndSeed();
  }, [db, seedDatabase]);

  const currentOrganization = useMemo(() => (
    organizations.find(org => org.id === currentOrganizationId) || organizations[0] || INITIAL_ORGANIZATIONS[0]
  ), [organizations, currentOrganizationId]);

  const scopedData = useMemo(() => {
    const orgId = currentOrganization?.id || DEFAULT_CLINIC_ORG_ID;
    const scopedMedicalRecords = Object.fromEntries(
      Object.entries(allMedicalRecords || {})
        .map(([patientId, record]) => [patientId, scopeItem(record, DEFAULT_CLINIC_ORG_ID)])
        .filter(([, record]) => recordBelongsToOrganization(record, orgId))
    );

    return {
      patients: allPatients.map(item => scopeItem(item, DEFAULT_CLINIC_ORG_ID)).filter(item => recordBelongsToOrganization(item, orgId)),
      queue: allQueue.map(item => scopeItem(item, DEFAULT_CLINIC_ORG_ID)).filter(item => recordBelongsToOrganization(item, orgId)),
      prescriptions: allPrescriptions.map(scopePrescription).filter(item => recordBelongsToOrganization(item, orgId)),
      inventory: allInventory.map(item => scopeItem(item, DEFAULT_PHARMACY_ORG_ID)).filter(item => recordBelongsToOrganization(item, orgId)),
      inquiries: allInquiries.map(scopeInquiry).filter(item => recordBelongsToOrganization(item, orgId)),
      scans: allScans.map(scopeScan).filter(item => recordBelongsToOrganization(item, orgId)),
      labOrders: allLabOrders.map(scopeLabOrder).filter(item => recordBelongsToOrganization(item, orgId)),
      notifications: allNotifications.map(scopeNotification).filter(item => item.recipient === role && recordBelongsToOrganization(item, orgId)),
      medicalRecords: scopedMedicalRecords,
      appointments: allAppointments.map(item => scopeItem(item, DEFAULT_CLINIC_ORG_ID)).filter(item => recordBelongsToOrganization(item, orgId)),
      invoices: allInvoices.map(scopeInvoice).filter(item => recordBelongsToOrganization(item, orgId)),
    };
  }, [
    currentOrganization, role, allPatients, allQueue, allPrescriptions, allInventory,
    allInquiries, allScans, allLabOrders, allNotifications, allMedicalRecords,
    allAppointments, allInvoices,
  ]);

  const {
    patients, queue, prescriptions, inventory, inquiries, scans,
    labOrders, notifications, medicalRecords, appointments, invoices,
  } = scopedData;

  // Notifications helper
  const createNotification = useCallback((notif) => {
    const notifId = db ? doc(collection(db, 'notifications')).id : String(Date.now());
    const newNotif = {
      ...notif,
      id: notifId,
      organizationId: notif.organizationId || notif.targetOrganizationId || currentOrganizationId,
      timestamp: new Date().toISOString(),
      read: false,
    };
    if (db) {
      setDoc(doc(db, 'notifications', notifId), newNotif).catch(e => console.error(e));
    } else {
      setNotifications(prev => [newNotif, ...prev]);
    }
  }, [currentOrganizationId, setNotifications]);

  const markNotificationAsRead = useCallback((id) => {
    if (db) {
      updateDoc(doc(db, 'notifications', String(id)), { read: true }).catch(e => console.error(e));
    } else {
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    }
  }, [setNotifications]);

  const markAllNotificationsAsRead = useCallback(() => {
    if (db) {
      // Loop over unread and mark read
      notifications.filter(n => !n.read).forEach(n => {
        updateDoc(doc(db, 'notifications', String(n.id)), { read: true }).catch(e => console.error(e));
      });
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [notifications, setNotifications]);

  const getUnreadCount = useCallback(() => notifications.filter(n => !n.read).length, [notifications]);

  // Sync document dir
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Sync document theme
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Translation helper
  const t = useCallback((key) => translations[lang]?.[key] ?? key, [lang]);
  const isAr = lang === 'ar';

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (email, password, selectedRole, selectedSpecialty, selectedOrgId) => {
    if (auth && db) {
      try {
        // Attempt sign in via Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Fetch User profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data();
          setRole(profile.role);
          setCurrentOrganizationId(profile.organizationId);
          if (profile.specialty) setSpecialty(profile.specialty);
          setLoggedUser(profile);
          setIsLoggedIn(true);
        } else {
          // Sync missing profile document
          const profile = {
            email: firebaseUser.email,
            name: firebaseUser.email.split('@')[0],
            nameAr: firebaseUser.email.split('@')[0],
            role: selectedRole,
            specialty: selectedSpecialty || 'general',
            organizationId: selectedOrgId || getDefaultOrganizationId(selectedRole, selectedSpecialty, organizations),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), profile);
          setRole(profile.role);
          setCurrentOrganizationId(profile.organizationId);
          setSpecialty(profile.specialty);
          setLoggedUser(profile);
          setIsLoggedIn(true);
        }
      } catch (err) {
        // Check if default user to auto-register
        const defaultUser = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (defaultUser) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            const profile = {
              email: defaultUser.email,
              name: defaultUser.name,
              nameAr: defaultUser.nameAr,
              role: defaultUser.role,
              specialty: defaultUser.specialty || null,
              organizationId: defaultUser.organizationId,
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), profile);

            setRole(profile.role);
            setCurrentOrganizationId(profile.organizationId);
            if (profile.specialty) setSpecialty(profile.specialty);
            setLoggedUser(profile);
            setIsLoggedIn(true);
            return;
          } catch (regErr) {
            console.error('Auto seeder registration error:', regErr);
          }
        }
        throw new Error(lang === 'ar' ? 'بيانات الدخول غير صحيحة أو خدمة Firebase غير مفعلة بالكامل' : 'Invalid login credentials or Firebase Auth not configured');
      }
    } else {
      // Local Login Fallback
      const user = allUsers.find(u =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role === selectedRole
      );

      if (!user) {
        if (selectedRole === 'patient') {
          const found = allPatients.find(
            p => p.phone === email || p.name?.toLowerCase() === email?.toLowerCase()
          );
          if (found) {
            setRole('patient');
            setLoggedUser({ name: found.name, nameAr: found.nameAr, patientId: found.id });
            setIsLoggedIn(true);
            setActivePage('home');
            return;
          }
        }
        throw new Error(lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid email or password');
      }

      setRole(user.role);
      setCurrentOrganizationId(user.organizationId);
      if (user.specialty) {
        setSpecialty(user.specialty);
      } else if (selectedSpecialty) {
        setSpecialty(selectedSpecialty);
      }
      setLoggedUser(user);
      setIsLoggedIn(true);

      const defaultPage = user.role === 'doctor' ? 'registry'
                        : user.role === 'pharmacy' ? 'pos'
                        : user.role === 'receptionist' ? 'register'
                        : user.role === 'radiology' ? 'orders'
                        : user.role === 'patient' ? 'home'
                        : 'dashboard';
      setActivePage(defaultPage);
    }
  }, [allUsers, allPatients, lang, setActivePage, organizations]);

  const handleSignUp = useCallback(async (email, name, password, selectedRole, selectedSpecialty, selectedOrgId) => {
    if (auth && db) {
      // Create Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      let orgId = selectedOrgId;
      if (selectedRole === 'doctor') {
        orgId = `clinic_dr_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        const newOrg = {
          id: orgId,
          type: 'clinic',
          role: 'doctor',
          specialty: selectedSpecialty || 'general',
          name: `Dr. ${name} Clinic`,
          nameAr: `عيادة د. ${name}`,
          city: 'Cairo',
          cityAr: 'القاهرة',
        };
        await setDoc(doc(db, 'organizations', orgId), newOrg);
      } else {
        if (!orgId) orgId = getDefaultOrganizationId(selectedRole, selectedSpecialty, organizations);
      }

      const profile = {
        email,
        name,
        nameAr: name,
        role: selectedRole,
        specialty: selectedRole === 'doctor' ? (selectedSpecialty || 'general') : null,
        organizationId: orgId,
      };

      // Set Firestore profile doc
      await setDoc(doc(db, 'users', firebaseUser.uid), profile);

      setRole(profile.role);
      setCurrentOrganizationId(profile.organizationId);
      if (profile.specialty) setSpecialty(profile.specialty);
      setLoggedUser(profile);
      setIsLoggedIn(true);

      const defaultPage = profile.role === 'doctor' ? 'registry'
                        : profile.role === 'pharmacy' ? 'pos'
                        : profile.role === 'receptionist' ? 'register'
                        : profile.role === 'radiology' ? 'orders'
                        : profile.role === 'patient' ? 'home'
                        : 'dashboard';
      setActivePage(defaultPage);
      return profile;
    } else {
      // Local Signup Fallback
      const exists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error(lang === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'Email already registered');
      }

      let orgId = selectedOrgId;

      if (selectedRole === 'doctor') {
        orgId = `clinic_dr_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        const newOrg = {
          id: orgId,
          type: 'clinic',
          role: 'doctor',
          specialty: selectedSpecialty || 'general',
          name: `Dr. ${name} Clinic`,
          nameAr: `عيادة د. ${name}`,
          city: 'Cairo',
          cityAr: 'القاهرة',
        };
        setOrganizations(prev => [...prev, newOrg]);
      } else if (selectedRole === 'receptionist') {
        if (!orgId) orgId = DEFAULT_CLINIC_ORG_ID;
      } else {
        if (!orgId) orgId = getDefaultOrganizationId(selectedRole, selectedSpecialty, organizations);
      }

      const newUser = {
        email,
        name,
        nameAr: name,
        password,
        role: selectedRole,
        specialty: selectedRole === 'doctor' ? (selectedSpecialty || 'general') : null,
        organizationId: orgId,
      };

      setUsers(prev => [...prev, newUser]);
      
      setRole(newUser.role);
      setCurrentOrganizationId(newUser.organizationId);
      if (newUser.specialty) {
        setSpecialty(newUser.specialty);
      }
      setLoggedUser(newUser);
      setIsLoggedIn(true);

      const defaultPage = newUser.role === 'doctor' ? 'registry'
                        : newUser.role === 'pharmacy' ? 'pos'
                        : newUser.role === 'receptionist' ? 'register'
                        : newUser.role === 'radiology' ? 'orders'
                        : newUser.role === 'patient' ? 'home'
                        : 'dashboard';
      setActivePage(defaultPage);

      return newUser;
    }
  }, [allUsers, lang, organizations, setOrganizations, setUsers, setRole, setCurrentOrganizationId, setSpecialty, setLoggedUser, setIsLoggedIn, setActivePage]);

  const handleLogout = useCallback(async () => {
    if (auth) {
      await signOut(auth);
    }
    setIsLoggedIn(false);
    setLoggedUser(null);
    setRole('doctor');
    setActivePage('registry');
  }, [setActivePage]);

  // ── Patient ───────────────────────────────────────────────────────────────
  const addPatient = useCallback((newPatient) => {
    const patientId = db ? doc(collection(db, 'patients')).id : String(Date.now());
    const patientObj = { ...newPatient, id: patientId, organizationId: currentOrganizationId };
    
    if (db) {
      setDoc(doc(db, 'patients', patientId), patientObj).catch(e => console.error(e));
      setDoc(doc(db, 'medical_records', patientId), {
        patientId,
        organizationId: currentOrganizationId,
        visits: [],
        chronicDiseases: [],
        allergies: [],
        vaccines: [],
      }).catch(e => console.error(e));
    } else {
      setPatients(prev => [...prev, patientObj]);
      setMedicalRecords(prev => ({
        ...prev,
        [patientId]: {
          patientId,
          organizationId: currentOrganizationId,
          visits: [],
          chronicDiseases: [],
          allergies: [],
          vaccines: [],
        }
      }));
    }
    return patientObj;
  }, [currentOrganizationId]);

  const requestPatientRecord = useCallback((patientPhone, targetOrgId) => {
    const targetOrg = organizations.find(org => org.id === targetOrgId);
    if (!targetOrg) {
      throw new Error(lang === 'ar' ? 'العيادة المستهدفة غير موجودة' : 'Target clinic does not exist');
    }

    const requestId = db ? doc(collection(db, 'record_requests')).id : String(Date.now());
    const newRequest = {
      id: requestId,
      patientPhone,
      requestingOrgId: currentOrganizationId,
      requestingDoctor: loggedUser?.name || 'Doctor',
      targetOrgId,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    if (db) {
      setDoc(doc(db, 'record_requests', requestId), newRequest).catch(e => console.error(e));
    } else {
      setRecordRequests(prev => [newRequest, ...prev]);
    }

    createNotification({
      type: 'record_request_received',
      recipient: 'doctor',
      title: 'طلب مشاركة ملف طبي',
      titleEn: 'Patient Record Request',
      message: `طلب الطبيب ${loggedUser?.name || 'زميل'} الوصول لملف المريض صاحب الهاتف ${patientPhone}`,
      messageEn: `Dr. ${loggedUser?.name || 'Colleague'} requested access to patient file with phone ${patientPhone}`,
      organizationId: targetOrgId,
      targetOrganizationId: targetOrgId,
      sourceOrganizationId: currentOrganizationId,
    });
  }, [currentOrganizationId, loggedUser, organizations, lang, createNotification]);

  const respondToRecordRequest = useCallback(async (requestId, approve = true) => {
    if (db) {
      try {
        const reqDoc = await getDoc(doc(db, 'record_requests', String(requestId)));
        if (!reqDoc.exists()) return;
        const requestToProcess = reqDoc.data();
        await updateDoc(doc(db, 'record_requests', String(requestId)), { status: approve ? 'approved' : 'rejected' });

        createNotification({
          type: 'record_request_response',
          recipient: 'doctor',
          title: approve ? 'تم قبول طلب الملف الطبي' : 'تم رفض طلب الملف الطبي',
          titleEn: approve ? 'Record Request Approved' : 'Record Request Rejected',
          message: approve 
            ? `وافق الطبيب على طلبك للوصول لملف الهاتف ${requestToProcess.patientPhone}`
            : `رفض الطبيب طلبك للوصول لملف الهاتف ${requestToProcess.patientPhone}`,
          messageEn: approve
            ? `The doctor approved your request for patient file with phone ${requestToProcess.patientPhone}`
            : `The doctor rejected your request for patient file with phone ${requestToProcess.patientPhone}`,
          organizationId: requestToProcess.requestingOrgId,
          targetOrganizationId: requestToProcess.requestingOrgId,
          sourceOrganizationId: currentOrganizationId,
        });

        if (approve) {
          const q = query(collection(db, 'patients'), where('phone', '==', requestToProcess.patientPhone), where('organizationId', '==', currentOrganizationId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const patientToShare = snap.docs[0].data();
            const newPatientId = doc(collection(db, 'patients')).id;

            const q2 = query(collection(db, 'patients'), where('phone', '==', requestToProcess.patientPhone), where('organizationId', '==', requestToProcess.requestingOrgId));
            const snap2 = await getDocs(q2);
            if (snap2.empty) {
              await setDoc(doc(db, 'patients', newPatientId), {
                ...patientToShare,
                id: newPatientId,
                organizationId: requestToProcess.requestingOrgId
              });

              const recordDoc = await getDoc(doc(db, 'medical_records', patientToShare.id));
              if (recordDoc.exists()) {
                await setDoc(doc(db, 'medical_records', newPatientId), {
                  ...recordDoc.data(),
                  patientId: newPatientId,
                  organizationId: requestToProcess.requestingOrgId
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('respondToRecordRequest error:', err);
      }
    } else {
      let requestToProcess = null;

      setRecordRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          requestToProcess = { ...req, status: approve ? 'approved' : 'rejected' };
          return requestToProcess;
        }
        return req;
      }));

      if (!requestToProcess) return;

      createNotification({
        type: 'record_request_response',
        recipient: 'doctor',
        title: approve ? 'تم قبول طلب الملف الطبي' : 'تم رفض طلب الملف الطبي',
        titleEn: approve ? 'Record Request Approved' : 'Record Request Rejected',
        message: approve 
          ? `وافق الطبيب على طلبك للوصول لملف الهاتف ${requestToProcess.patientPhone}`
          : `رفض الطبيب طلبك للوصول لملف الهاتف ${requestToProcess.patientPhone}`,
        messageEn: approve
          ? `The doctor approved your request for patient file with phone ${requestToProcess.patientPhone}`
          : `The doctor rejected your request for patient file with phone ${requestToProcess.patientPhone}`,
        organizationId: requestToProcess.requestingOrgId,
        targetOrganizationId: requestToProcess.requestingOrgId,
        sourceOrganizationId: currentOrganizationId,
      });

      if (approve) {
        const patientToShare = allPatients.find(p => 
          p.phone === requestToProcess.patientPhone && 
          scopeItem(p, DEFAULT_CLINIC_ORG_ID).organizationId === currentOrganizationId
        );

        if (patientToShare) {
          const newPatientId = Date.now();
          setPatients(prev => {
            const alreadyExists = prev.some(p => 
              p.phone === requestToProcess.patientPhone && 
              scopeItem(p, DEFAULT_CLINIC_ORG_ID).organizationId === requestToProcess.requestingOrgId
            );
            if (alreadyExists) return prev;
            return [...prev, {
              ...patientToShare,
              id: newPatientId,
              organizationId: requestToProcess.requestingOrgId
            }];
          });

          const targetMedicalRecord = allMedicalRecords[patientToShare.id];
          if (targetMedicalRecord) {
            setMedicalRecords(prev => {
              return {
                ...prev,
                [newPatientId]: {
                  ...targetMedicalRecord,
                  patientId: newPatientId,
                  organizationId: requestToProcess.requestingOrgId,
                }
              };
            });
          }
        }
      }
    }
  }, [currentOrganizationId, allPatients, allMedicalRecords, setPatients, setMedicalRecords, createNotification]);

  const addToQueue = useCallback((patient) => {
    const queueId = db ? doc(collection(db, 'queue')).id : String(Date.now());
    const queueObj = {
      id: queueId,
      organizationId: currentOrganizationId,
      patientId: patient.id,
      name: patient.name,
      nameAr: patient.nameAr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'waiting',
    };
    if (db) {
      setDoc(doc(db, 'queue', queueId), queueObj).catch(e => console.error(e));
    } else {
      setQueue(prev => {
        if (prev.find(q => q.patientId === patient.id && scopeItem(q, DEFAULT_CLINIC_ORG_ID).organizationId === currentOrganizationId)) return prev;
        return [...prev, queueObj];
      });
    }
  }, [currentOrganizationId]);

  // ── Prescriptions ─────────────────────────────────────────────────────────
  const sendPrescription = useCallback((newRx) => {
    const rxId = String(newRx.id || Date.now());
    const rxObj = {
      ...newRx,
      id: rxId,
      sourceOrganizationId: currentOrganizationId,
      targetOrganizationId: newRx.targetOrganizationId || DEFAULT_PHARMACY_ORG_ID,
      organizationId: newRx.organizationId || newRx.targetOrganizationId || DEFAULT_PHARMACY_ORG_ID,
    };
    if (db) {
      setDoc(doc(db, 'prescriptions', rxId), rxObj).catch(e => console.error(e));
    } else {
      setPrescriptions(prev => [rxObj, ...prev]);
    }
  }, [currentOrganizationId]);

  const dispensePrescription = useCallback(async (rxId) => {
    if (db) {
      try {
        const rxDoc = await getDoc(doc(db, 'prescriptions', String(rxId)));
        if (!rxDoc.exists()) return false;
        const rx = rxDoc.data();

        let canDispense = true;
        for (const drug of rx.drugs) {
          const q = query(collection(db, 'inventory'), where('name', '==', drug.name));
          const snap = await getDocs(q);
          if (snap.empty || snap.docs[0].data().stock <= 0) {
            canDispense = false;
          }
        }
        if (!canDispense) return false;

        for (const drug of rx.drugs) {
          const q = query(collection(db, 'inventory'), where('name', '==', drug.name));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const item = snap.docs[0];
            await updateDoc(doc(db, 'inventory', item.id), { stock: Math.max(0, item.data().stock - 1) });
          }
        }
        await updateDoc(doc(db, 'prescriptions', String(rxId)), { status: 'Dispensed' });
        return true;
      } catch (err) {
        console.error('dispensePrescription error:', err);
        return false;
      }
    } else {
      const rx = prescriptions.find(r => r.id === rxId);
      if (!rx) return false;

      let canDispense = true;
      rx.drugs.forEach(drug => {
        const item = inventory.find(i => i.name.toLowerCase() === drug.name.toLowerCase());
        if (!item || item.stock <= 0) canDispense = false;
      });
      if (!canDispense) return false;

      setInventory(prev => prev.map(item => {
        const scopedItem = scopeItem(item, DEFAULT_PHARMACY_ORG_ID);
        const needed = scopedItem.organizationId === currentOrganizationId &&
          rx.drugs.find(d => d.name.toLowerCase() === item.name.toLowerCase());
        return needed ? { ...item, stock: Math.max(0, item.stock - 1) } : item;
      }));
      setPrescriptions(prev => prev.map(r => r.id === rxId ? { ...r, status: 'Dispensed' } : r));
      return true;
    }
  }, [currentOrganizationId, prescriptions, inventory]);

  // ── Inventory ─────────────────────────────────────────────────────────────
  const updateStock = useCallback(async (drugName, amount) => {
    if (db) {
      try {
        const q = query(collection(db, 'inventory'), where('name', '==', drugName), where('organizationId', '==', currentOrganizationId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docId = snap.docs[0].id;
          const currentStock = snap.docs[0].data().stock;
          await updateDoc(doc(db, 'inventory', docId), { stock: currentStock + amount });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setInventory(prev => prev.map(item =>
        item.name === drugName && scopeItem(item, DEFAULT_PHARMACY_ORG_ID).organizationId === currentOrganizationId
          ? { ...item, stock: item.stock + amount, organizationId: currentOrganizationId }
          : item
      ));
    }
  }, [currentOrganizationId]);

  const addMedication = useCallback((newMed) => {
    const medId = db ? doc(collection(db, 'inventory')).id : String(Date.now());
    const medObj = { ...newMed, id: medId, organizationId: currentOrganizationId };
    if (db) {
      setDoc(doc(db, 'inventory', medId), medObj).catch(e => console.error(e));
    } else {
      setInventory(prev => [...prev, medObj]);
    }
  }, [currentOrganizationId]);

  // ── Scans ─────────────────────────────────────────────────────────────────
  const uploadScan = useCallback((newScan) => {
    const scanId = String(newScan.id || Date.now());
    const scanObj = {
      ...newScan,
      id: scanId,
      sourceOrganizationId: currentOrganizationId,
      organizationId: currentOrganizationId,
      targetOrganizationId: newScan.targetOrganizationId || DEFAULT_CLINIC_ORG_ID,
    };
    if (db) {
      setDoc(doc(db, 'scans', scanId), scanObj).catch(e => console.error(e));
    } else {
      setScans(prev => [scanObj, ...prev]);
    }
  }, [currentOrganizationId]);

  // ── Inquiries ─────────────────────────────────────────────────────────────
  const sendInquiry = useCallback((newInq) => {
    const inqId = String(newInq.id || Date.now());
    const inqObj = {
      ...newInq,
      id: inqId,
      sourceOrganizationId: currentOrganizationId,
      targetOrganizationId: newInq.targetOrganizationId || DEFAULT_CLINIC_ORG_ID,
      organizationId: currentOrganizationId,
    };
    if (db) {
      setDoc(doc(db, 'inquiries', inqId), inqObj).catch(e => console.error(e));
    } else {
      setInquiries(prev => [inqObj, ...prev]);
    }
  }, [currentOrganizationId]);

  const replyInquiry = useCallback((id, replyText) => {
    if (db) {
      updateDoc(doc(db, 'inquiries', String(id)), { reply: replyText, status: 'Replied' }).catch(e => console.error(e));
    } else {
      setInquiries(prev => prev.map(inq =>
        inq.id === id ? { ...inq, reply: replyText, status: 'Replied' } : inq
      ));
    }
  }, []);

  // ── Invoices / POS ────────────────────────────────────────────────────────
  const createInvoice = useCallback(async (inv) => {
    const { adjustInventory = true, ...invoiceData } = inv;
    const invoiceId = db ? doc(collection(db, 'invoices')).id : String(Date.now());
    const fallbackName = invoiceData.patientName || invoiceData.customerName || 'Walk-in Customer';
    const fallbackNameAr = invoiceData.patientNameAr || invoiceData.customerNameAr || 'عميل الصيدلية';
    const newInv = {
      ...invoiceData,
      id: invoiceId,
      organizationId: invoiceData.organizationId || currentOrganizationId,
      patientName: fallbackName,
      patientNameAr: fallbackNameAr,
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: invoiceData.status || 'Unpaid',
      source: invoiceData.source || 'pharmacy_pos',
    };

    if (db) {
      try {
        await setDoc(doc(db, 'invoices', invoiceId), newInv);
        if (adjustInventory && Array.isArray(newInv.items)) {
          for (const item of newInv.items) {
            const q = query(collection(db, 'inventory'), where('name', '==', item.name), where('organizationId', '==', newInv.organizationId));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const docId = snap.docs[0].id;
              await updateDoc(doc(db, 'inventory', docId), { stock: Math.max(0, snap.docs[0].data().stock - (item.qty || 1)) });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      if (adjustInventory && Array.isArray(newInv.items)) {
        setInventory(prev => prev.map(item => {
          const scopedItem = scopeItem(item, DEFAULT_PHARMACY_ORG_ID);
          const sold = scopedItem.organizationId === newInv.organizationId &&
            newInv.items.find(i => i.name.toLowerCase() === item.name.toLowerCase());
          if (!sold) return item;
          return { ...item, stock: Math.max(0, item.stock - (sold.qty || 1)) };
        }));
      }
      setInvoices(prev => [newInv, ...prev]);
    }

    createNotification({
      type: 'invoice_created', recipient: 'pharmacy', title: 'فاتورة جديدة', titleEn: 'Invoice Created',
      message: `تم إنشاء فاتورة للمريض ${newInv.patientName} بالمبلغ ${newInv.total}`,
      messageEn: `Invoice for ${newInv.patientName} total ${newInv.total}`,
      organizationId: newInv.organizationId,
      patientId: newInv.patientId, patientName: newInv.patientName, patientNameAr: newInv.patientNameAr,
    });
    return newInv;
  }, [currentOrganizationId, createNotification]);

  const markInvoicePaid = useCallback((invoiceId, method = 'cash') => {
    if (db) {
      updateDoc(doc(db, 'invoices', String(invoiceId)), { status: 'Paid', paymentMethod: method }).catch(e => console.error(e));
    } else {
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'Paid', paymentMethod: method } : inv));
    }
  }, []);

  const getInvoicesForDay = useCallback((dateStr) => {
    return invoices.filter(i => i.date === dateStr);
  }, [invoices]);

  const getInvoiceById = useCallback((id) => invoices.find(i => i.id === id), [invoices]);

  // ── Lab Orders & Requests ──────────────────────────────────────────────────
  const createLabOrder = useCallback((order) => {
    const orderId = db ? doc(collection(db, 'lab_orders')).id : String(Date.now());
    const newOrder = {
      ...order,
      id: orderId,
      sourceOrganizationId: currentOrganizationId,
      targetOrganizationId: order.targetOrganizationId || DEFAULT_LAB_ORG_ID,
      organizationId: order.targetOrganizationId || DEFAULT_LAB_ORG_ID,
      date: new Date().toLocaleDateString('en-GB'),
      status: 'Pending',
    };

    if (db) {
      setDoc(doc(db, 'lab_orders', orderId), newOrder).catch(e => console.error(e));
    } else {
      setLabOrders(prev => [newOrder, ...prev]);
    }

    let total = 0;
    const invoiceItems = order.requestedTests.map(t => {
      let price = 150;
      const tid = t.test;
      if (tid === 'MRI' || tid === 'CT' || tid === 'CT Scan') {
        price = 800;
      } else if (tid === 'XRay-Chest' || tid === 'XRay-Knee' || tid === 'Ultrasound' || tid === 'ECG') {
        price = 300;
      }
      total += price;
      return {
        name: isAr ? t.name_ar : t.name,
        qty: 1,
        price: price
      };
    });

    createInvoice({
      patientId: order.patientId,
      patientName: order.patientName,
      patientNameAr: order.patientNameAr,
      items: invoiceItems,
      total,
      tax: 0,
      paymentMethod: 'cash',
      status: 'Unpaid',
      source: 'lab_order',
      organizationId: newOrder.targetOrganizationId,
      adjustInventory: false,
    });

    createNotification({
      type: 'order_received',
      recipient: 'radiology',
      title: 'طلب تحليل جديد',
      titleEn: 'New Lab Order',
      message: `طلب تحليل جديد من ${order.doctor} للمريض ${order.patientName}`,
      messageEn: `New lab order from ${order.doctor} for patient ${order.patientName}`,
      patientName: order.patientName,
      patientNameAr: order.patientNameAr,
      patientId: order.patientId,
      organizationId: newOrder.targetOrganizationId,
      sourceOrganizationId: currentOrganizationId,
      targetOrganizationId: newOrder.targetOrganizationId,
      actionUrl: `/radiology/orders/${newOrder.id}`,
    });
    return newOrder;
  }, [currentOrganizationId, createNotification, createInvoice, isAr]);

  const updateLabOrderStatus = useCallback((orderId, status) => {
    if (db) {
      updateDoc(doc(db, 'lab_orders', String(orderId)), { status }).catch(e => console.error(e));
    } else {
      setLabOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      ));
    }
  }, []);

  const uploadLabResults = useCallback(async (orderId, results) => {
    if (db) {
      try {
        await updateDoc(doc(db, 'lab_orders', String(orderId)), { status: 'Completed', results });
        const orderDoc = await getDoc(doc(db, 'lab_orders', String(orderId)));
        if (orderDoc.exists()) {
          const order = orderDoc.data();
          createNotification({
            type: 'lab_results_ready',
            recipient: 'doctor',
            title: 'نتائج تحليل جاهزة',
            titleEn: 'Lab Results Ready',
            message: `نتائج تحليل ${order.patientName} جاهزة للمراجعة`,
            messageEn: `Lab results for ${order.patientName} are ready for review`,
            patientName: order.patientName,
            patientNameAr: order.patientNameAr,
            patientId: order.patientId,
            organizationId: order.sourceOrganizationId || DEFAULT_CLINIC_ORG_ID,
            sourceOrganizationId: currentOrganizationId,
            targetOrganizationId: order.sourceOrganizationId || DEFAULT_CLINIC_ORG_ID,
            actionUrl: `/doctor/lab-results/${orderId}`,
          });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setLabOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updated = { ...order, status: 'Completed', results };
          createNotification({
            type: 'lab_results_ready',
            recipient: 'doctor',
            title: 'نتائج تحليل جاهزة',
            titleEn: 'Lab Results Ready',
            message: `نتائج تحليل ${order.patientName} جاهزة للمراجعة`,
            messageEn: `Lab results for ${order.patientName} are ready for review`,
            patientName: order.patientName,
            patientNameAr: order.patientNameAr,
            patientId: order.patientId,
            organizationId: order.sourceOrganizationId || DEFAULT_CLINIC_ORG_ID,
            sourceOrganizationId: currentOrganizationId,
            targetOrganizationId: order.sourceOrganizationId || DEFAULT_CLINIC_ORG_ID,
            actionUrl: `/doctor/lab-results/${orderId}`,
          });
          return updated;
        }
        return order;
      }));
    }
  }, [currentOrganizationId, createNotification]);

  // ── Appointments ───────────────────────────────────────────────────────────
  const createAppointment = useCallback((appt) => {
    const apptId = db ? doc(collection(db, 'appointments')).id : String(Date.now());
    const newAppt = { ...appt, id: apptId, organizationId: currentOrganizationId, status: 'Scheduled', reminderSent: false };
    if (db) {
      setDoc(doc(db, 'appointments', apptId), newAppt).catch(e => console.error(e));
    } else {
      setAppointments(prev => [newAppt, ...prev]);
    }
    createNotification({
      type: 'appointment_created', recipient: 'reception', title: 'موعد جديد', titleEn: 'New Appointment',
      message: `تم حجز موعد للمريض ${appt.patientName} بتاريخ ${appt.date} ${appt.time}`,
      messageEn: `Appointment for ${appt.patientName} on ${appt.date} ${appt.time}`,
      organizationId: currentOrganizationId,
      patientId: appt.patientId, patientName: appt.patientName, patientNameAr: appt.patientNameAr,
    });
    return newAppt;
  }, [currentOrganizationId, createNotification]);

  const getAppointmentsForDay = useCallback((dateStr) => {
    return appointments.filter(a => a.date === dateStr);
  }, [appointments]);

  const sendAppointmentReminder = useCallback(async (apptId) => {
    if (db) {
      try {
        await updateDoc(doc(db, 'appointments', String(apptId)), { reminderSent: true });
        const apptDoc = await getDoc(doc(db, 'appointments', String(apptId)));
        if (apptDoc.exists()) {
          const appt = apptDoc.data();
          createNotification({
            type: 'appointment_reminder', recipient: 'patient', title: 'تذكير موعد', titleEn: 'Appointment Reminder',
            message: `تذكير: لديك موعد مع ${appt.doctor} في ${appt.time} بتاريخ ${appt.date}`,
            messageEn: `Reminder: You have an appointment with ${appt.doctor} at ${appt.time} on ${appt.date}`,
            organizationId: appt.organizationId || currentOrganizationId,
            patientId: appt.patientId, patientName: appt.patientName, patientNameAr: appt.patientNameAr,
          });
          return true;
        }
      } catch (e) {
        console.error(e);
      }
      return false;
    } else {
      const appt = appointments.find(a => a.id === apptId);
      if (!appt) return false;
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, reminderSent: true } : a));
      createNotification({
        type: 'appointment_reminder', recipient: 'patient', title: 'تذكير موعد', titleEn: 'Appointment Reminder',
        message: `تذكير: لديك موعد مع ${appt.doctor} في ${appt.time} بتاريخ ${appt.date}`,
        messageEn: `Reminder: You have an appointment with ${appt.doctor} at ${appt.time} on ${appt.date}`,
        organizationId: appt.organizationId || currentOrganizationId,
        patientId: appt.patientId, patientName: appt.patientName, patientNameAr: appt.patientNameAr,
      });
      return true;
    }
  }, [appointments, createNotification, currentOrganizationId]);

  // ── Medical Records ────────────────────────────────────────────────────────
  const logSymptom = useCallback(async (patientId, log) => {
    if (db) {
      try {
        const recordDoc = await getDoc(doc(db, 'medical_records', String(patientId)));
        const record = recordDoc.exists() ? recordDoc.data() : { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [], symptomLogs: [] };
        const symptomLogs = record.symptomLogs || [];
        await setDoc(doc(db, 'medical_records', String(patientId)), {
          ...record,
          symptomLogs: [log, ...symptomLogs]
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setMedicalRecords(prev => {
        const record = prev[patientId] || { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [], symptomLogs: [] };
        const currentLogs = record.symptomLogs || [];
        return {
          ...prev,
          [patientId]: {
            ...record,
            symptomLogs: [log, ...currentLogs]
          }
        };
      });
    }
  }, [currentOrganizationId]);

  const addVisitToRecord = useCallback(async (patientId, visitData) => {
    const visitId = `V${Date.now()}`;
    const visitObj = { ...visitData, id: visitId };
    if (db) {
      try {
        const recordDoc = await getDoc(doc(db, 'medical_records', String(patientId)));
        const record = recordDoc.exists() ? recordDoc.data() : { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [] };
        const currentVisits = record.visits || [];
        await setDoc(doc(db, 'medical_records', String(patientId)), {
          ...record,
          visits: [visitObj, ...currentVisits]
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setMedicalRecords(prev => {
        const record = prev[patientId] || { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [] };
        return {
          ...prev,
          [patientId]: {
            ...record,
            organizationId: record.organizationId || currentOrganizationId,
            visits: [visitObj, ...record.visits],
          },
        };
      });
    }
  }, [currentOrganizationId]);

  const getPatientMedicalRecord = useCallback((patientId) => {
    return medicalRecords[patientId] || null;
  }, [medicalRecords]);

  const addPatientAllergy = useCallback(async (patientId, allergy) => {
    const allergyObj = { ...allergy, id: Date.now() };
    if (db) {
      try {
        const recordDoc = await getDoc(doc(db, 'medical_records', String(patientId)));
        const record = recordDoc.exists() ? recordDoc.data() : { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [] };
        const currentAllergies = record.allergies || [];
        if (currentAllergies.some(a => a.name.toLowerCase() === allergy.name.toLowerCase())) return;
        await setDoc(doc(db, 'medical_records', String(patientId)), {
          ...record,
          allergies: [...currentAllergies, allergyObj]
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setMedicalRecords(prev => {
        const record = prev[patientId] || { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [] };
        const currentAllergies = record.allergies || [];
        if (currentAllergies.some(a => a.name.toLowerCase() === allergy.name.toLowerCase())) return prev;
        return {
          ...prev,
          [patientId]: {
            ...record,
            organizationId: record.organizationId || currentOrganizationId,
            allergies: [...currentAllergies, allergyObj],
          }
        };
      });
    }
  }, [currentOrganizationId]);

  const removePatientAllergy = useCallback(async (patientId, allergyId) => {
    if (db) {
      try {
        const recordDoc = await getDoc(doc(db, 'medical_records', String(patientId)));
        if (!recordDoc.exists()) return;
        const record = recordDoc.data();
        const updatedAllergies = (record.allergies || []).filter(a => a.id !== allergyId);
        await setDoc(doc(db, 'medical_records', String(patientId)), {
          ...record,
          allergies: updatedAllergies
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setMedicalRecords(prev => {
        const record = prev[patientId];
        if (!record) return prev;
        return {
          ...prev,
          [patientId]: {
            ...record,
            allergies: (record.allergies || []).filter(a => a.id !== allergyId),
          }
        };
      });
    }
  }, []);

  const addPatientChronicDisease = useCallback(async (patientId, disease) => {
    const diseaseObj = { ...disease, id: Date.now() };
    if (db) {
      try {
        const recordDoc = await getDoc(doc(db, 'medical_records', String(patientId)));
        const record = recordDoc.exists() ? recordDoc.data() : { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [] };
        const currentDiseases = record.chronicDiseases || [];
        if (currentDiseases.some(d => d.code === disease.code)) return;
        await setDoc(doc(db, 'medical_records', String(patientId)), {
          ...record,
          chronicDiseases: [...currentDiseases, diseaseObj]
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setMedicalRecords(prev => {
        const record = prev[patientId] || { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [] };
        const currentDiseases = record.chronicDiseases || [];
        if (currentDiseases.some(d => d.code === disease.code)) return prev;
        return {
          ...prev,
          [patientId]: {
            ...record,
            organizationId: record.organizationId || currentOrganizationId,
            chronicDiseases: [...currentDiseases, diseaseObj],
          }
        };
      });
    }
  }, [currentOrganizationId]);

  const removePatientChronicDisease = useCallback(async (patientId, diseaseId) => {
    if (db) {
      try {
        const recordDoc = await getDoc(doc(db, 'medical_records', String(patientId)));
        if (!recordDoc.exists()) return;
        const record = recordDoc.data();
        const updatedDiseases = (record.chronicDiseases || []).filter(d => d.id !== diseaseId);
        await setDoc(doc(db, 'medical_records', String(patientId)), {
          ...record,
          chronicDiseases: updatedDiseases
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setMedicalRecords(prev => {
        const record = prev[patientId];
        if (!record) return prev;
        return {
          ...prev,
          [patientId]: {
            ...record,
            chronicDiseases: (record.chronicDiseases || []).filter(d => d.id !== diseaseId),
          }
        };
      });
    }
  }, []);

  const updateChronicDiseases = useCallback(async (patientId, diseases) => {
    if (db) {
      try {
        const recordDoc = await getDoc(doc(db, 'medical_records', String(patientId)));
        const record = recordDoc.exists() ? recordDoc.data() : { patientId, organizationId: currentOrganizationId, visits: [], chronicDiseases: [], allergies: [], vaccines: [] };
        await setDoc(doc(db, 'medical_records', String(patientId)), {
          ...record,
          chronicDiseases: diseases
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setMedicalRecords(prev => ({
        ...prev,
        [patientId]: {
          ...prev[patientId],
          organizationId: prev[patientId]?.organizationId || currentOrganizationId,
          chronicDiseases: diseases,
        },
      }));
    }
  }, [currentOrganizationId]);

  // ── Computed helpers ──────────────────────────────────────────────────────
  const getStockStatus = useCallback((drugName) => {
    const item = inventory.find(i => i.name.toLowerCase() === drugName.toLowerCase());
    if (!item || item.stock <= 0) return 'Out';
    if (item.stock < 10) return 'Low';
    return 'Available';
  }, [inventory]);

  const value = {
    // Auth
    isLoggedIn, role, setRole, specialty, setSpecialty, loggedUser,
    handleLogin, handleSignUp, handleLogout,
    organizations, currentOrganization, currentOrganizationId, setCurrentOrganizationId,
    allUsers, setUsers,
    // UI
    lang, setLang, isAr, t, isMenuOpen, setIsMenuOpen, theme, setTheme, activePage, setActivePage,
    // Data
    patients, queue, prescriptions, inventory, inquiries, scans,
    labOrders, notifications, medicalRecords, appointments, invoices,
    recordRequests,
    // Actions
    addPatient, addToQueue,
    requestPatientRecord, respondToRecordRequest,
    sendPrescription, dispensePrescription,
    updateStock, addMedication,
    uploadScan, sendInquiry, replyInquiry,
    createLabOrder, updateLabOrderStatus, uploadLabResults,
    createNotification, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount,
    addVisitToRecord, getPatientMedicalRecord, updateChronicDiseases, logSymptom,
    addPatientAllergy, removePatientAllergy, addPatientChronicDisease, removePatientChronicDisease,
    // Appointments
    createAppointment, getAppointmentsForDay, sendAppointmentReminder,
    // Invoices / POS
    createInvoice, markInvoicePaid, getInvoicesForDay, getInvoiceById,
    getStockStatus,
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export const useClinic = () => {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be inside ClinicProvider');
  return ctx;
};
