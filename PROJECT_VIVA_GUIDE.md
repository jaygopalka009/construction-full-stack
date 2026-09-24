# 🏗️ BuildMaster Construction ERP - Practical & Viva Guide

## 1. પ્રોજેક્ટ વિશે સૌપ્રથમ શું બોલવું? (Introduction Speech)
Good morning / afternoon Sir/Madam,
મારું પ્રોજેક્ટ છે **BuildMaster Construction ERP**. આ એક **Full Stack Web Application** છે જે ખાસ કરીને સિવિલ કન્સ્ટ્રક્શન કંપનીઓ, બિલ્ડરો અને સાઈટ સુપરવાઇઝર્સ માટે બનાવવામાં આવ્યું છે.

### શા માટે આ પ્રોજેક્ટ જરૂરી છે?
કન્સ્ટ્રક્શન સાઈટ પર રોજ કેટલું કામ થયું, કેટલા કારીગરો હાજર હતા, કેટલો સિમેન્ટ કે સ્ટીલ વપરાયો અને રોજનો કેટલો ખર્ચ થયો તેનો સાચો હિસાબ ઓફિસમાં બેઠેલા એડમિન સુધી સમયસર પહોંચતો નથી. અમારું સોફ્ટવેર આ સમસ્યાનું સંપૂર્ણ ડિજિટલ સોલ્યુશન પૂરું પાડે છે.

### મુખ્ય ૩ યુઝર રોલ્સ:
1. **Admin (ઓનર / કન્ટ્રાક્ટર)**: પ્રોજેક્ટ્સ બનાવે છે, એન્જિનિયર અસાઇન કરે છે, ટાસ્ક અને ખર્ચ મંજૂર કરે છે.
2. **Site Engineer (ફીલ્ડ સુપરવાઈઝર)**: સાઈટ પરથી લાઈવ ફોટા અપલોડ કરીને ટાસ્ક પૂરા કરે છે, રોજના મજૂરોની હાજરી અને વપરાયેલ માલની વિગત સાથે DPR સબમિટ કરે છે.
3. **Client (ગ્રાહક)**: પોતાના મકાનનું લાઈવ પ્રગતિ ટકાવારી (Progress %) અને ફોટા ઘરે બેઠા જોઈ શકે છે.

---

## 2. કઈ ફાઇલ શેના માટે છે? (File-by-File Breakdown)

### Backend (Node.js, Express, MongoDB)
- **backend/server.js**: મુખ્ય એન્ટ્રી પોઈન્ટ. પોર્ટ 5000 પર સર્વર રન કરે છે, CORS અને બધા API રૂટ્સ જોડે છે.
- **backend/database/db.js**: MongoDB ડેટાબેઝ કનેક્શન. 10 કલેક્શન્સ (projects, tasks, dprs, reports, expenses, payments, workers, materials, admins, engineers) મેનેજ કરે છે.
- **backend/routes/auth.js**: Admin, Engineer અને Client નું લોગિન અને ઓથેન્ટિકેશન હેન્ડલ કરે છે.
- **backend/routes/projects.js**: પ્રોજેક્ટ્સ અને ટાસ્ક CRUD, સ્ટેજ પ્રગતિ ટકાવારી અને સાઈટ ફોટો અપલોડ.
- **backend/routes/reports.js**: Daily Progress Report (DPR) સેવ અને આર્કાઇવ ફિલ્ટરિંગ.
- **backend/routes/expenses.js**: સાઈટ ક્લેઇમ, કેશ એડવાન્સ અને વોલેટ ટ્રાન્ઝેક્શન્સ.
- **backend/routes/workers.js**: સાઈટ મજૂરોનું લિસ્ટ, રોલ (કડિયો, હેલ્પર વગેરે), દૈનિક મજૂરી અને હાજરી.
- **backend/routes/materials.js**: સાઈટ સ્ટોક, ઇન્વેન્ટરી અને માલસામાન રિક્વેસ્ટ.
- **backend/routes/notifications.js**: રીઅલ-ટાઇમ નોટિફિકેશન અને એલર્ટ સિસ્ટમ.
- **backend/routes/engineers.js**: એન્જિનિયર પ્રોફાઇલ અને પ્રોજેક્ટ એલોકેશન.

### Frontend (React.js, Vite, Vanilla CSS)
- **frontend/src/main.jsx**: React નું એન્ટ્રી પોઇન્ટ જે DOM માં રૂટ કમ્પોનન્ટ રેન્ડર કરે છે.
- **frontend/src/App.jsx**: સેન્ટ્રલાઇઝ્ડ કંટ્રોલર, બધા સ્ટેટ્સ, API કૉલિંગ, ટોસ્ટ એલર્ટ અને નેવિગેશન.
- **frontend/src/components/HomePage.jsx**: લેન્ડિંગ પોર્ટલ અને રોલ સિલેક્શન લોગિન કાર્ડ્સ.
- **frontend/src/components/AdminDashboard.jsx**: એડમિન માટેનું કંટ્રોલ સેન્ટર (પ્રોજેક્ટ્સ, ટાસ્ક એપ્રુવલ, એક્સપેન્સ વેરિફિકેશન, રિપોર્ટ્સ).
- **frontend/src/components/SiteEngineerDashboard.jsx**: એન્જિનિયર માટેનું સાઈટ વર્કબેન્ચ (ટાસ્ક ફોટો અપલોડ, વર્કર્સ સિલેક્શન, મટીરીયલ એન્ટ્રી, મશીનરી ચાર્જ, DPR સબમિશન).
- **frontend/src/components/ClientDashboard.jsx**: ક્લાયન્ટ માટે પારદર્શક પ્રોજેક્ટ ટ્રેકિંગ અને ફોટો ગેલેરી પોર્ટલ.
- **frontend/src/components/Navbar.jsx**: હેડર નેવિગેશન, રોલ બેજ, નોટિફિકેશન બેલ અને લોગઆઉટ.
- **frontend/src/utils/materialCatalog.js**: સિમેન્ટ, સ્ટીલ, ઈંટ, રેતી જેવા બાંધકામ મટીરીયલ્સનું કેટલોગ અને રેટ્સ.
- **frontend/src/utils/laborCategories.js**: કારીગરોના પ્રકાર અને તેમના સ્ટાન્ડર્ડ દૈનિક ભથ્થાં (Wages).
- **frontend/src/utils/taskTemplates.js**: સિવિલ કન્સ્ટ્રક્શન સ્ટેજીસ (Survey, Excavation, Slab, Brickwork વગેરે).

---

## 3. પ્રશ્નોત્તરી (Top Viva Questions & Answers)
1. **પ્રોજેક્ટનું આર્કિટેક્ચર શું છે?**
   MERN Stack (MongoDB, Express.js, React.js, Node.js) - REST API architecture.
2. **ફોટો અપલોડ કેવી રીતે થાય છે?**
   HTML5 Canvas થી ક્લાયન્ટ સાઈડ કમ્પ્રેસ થઈને Base64 ફોર્મેટમાં મોકલવામાં આવે છે.
3. **ટાસ્ક અને DPR વચ્ચે શું તફાવત છે?**
   ટાસ્ક કન્સ્ટ્રક્શનનું મોટું સ્ટેજ પૂર્ણ કરવા માટે છે (ફોટો પુરાવા સાથે). જ્યારે DPR આજના દિવસનું કામ, મજૂરોની મજૂરી અને વપરાયેલ માલનો દૈનિક હિસાબ છે.
4. **પ્રગતિ ટકાવારી કેવી રીતે ગણાય છે?**
   મંજૂર થયેલા ટાસ્ક ભાગ્યા કુલ ટાસ્ક ગુણ્યા 100.
5. **ડેટાબેઝ કયો વાપર્યો છે?**
   MongoDB (સંગ્રહ માટે projects, tasks, dprs, expenses, workers વગેરે કલેક્શન્સ સાથે).
