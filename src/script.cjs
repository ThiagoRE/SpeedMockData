// script to run locally using node to generate the new file content
const fs = require('fs');

const mockUsers = [
  { id: 1, name: 'Carlos Administrador', email: 'admin@clubdeportivo.com', password: 'admin123', role: 'admin', avatar: 'CA', phone: '300-111-2233', status: 'active', profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 2, name: 'María González', email: 'profesor@clubdeportivo.com', password: 'prof123', role: 'profesor', avatar: 'MG', phone: '310-222-3344', status: 'active', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 3, name: 'Juan Deportista', email: 'deportista@clubdeportivo.com', password: 'dep123', role: 'deportista', avatar: 'JD', phone: '320-333-4455', status: 'active', familyId: 1, profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 4, name: 'Laura Martínez', email: 'laura.m@clubdeportivo.com', password: 'laura123', role: 'profesor', avatar: 'LM', phone: '315-444-5566', status: 'active', profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 5, name: 'Pedro Sánchez', email: 'pedro.s@clubdeportivo.com', password: 'pedro123', role: 'deportista', avatar: 'PS', phone: '300-555-6677', status: 'active', familyId: 2, profileImage: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 6, name: 'Ana Rodríguez', email: 'ana.r@clubdeportivo.com', password: 'ana123', role: 'deportista', avatar: 'AR', phone: '311-666-7788', status: 'inactive', familyId: 2, profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop' },
];

const mockMembers = [
  { id: 1, name: 'Juan Deportista', document: '1001234567', phone: '320-333-4455', email: 'juan.d@email.com', birthDate: '2011-05-15', familyId: 1, sports: [1, 2], teamId: 1, positionId: 'ST1', venueIds: [1], enrollmentDate: '2025-01-10', status: 'active', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop', coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' },
  { id: 2, name: 'Sofía Deportista', document: '1001234568', phone: '320-333-4456', email: 'sofia.d@email.com', birthDate: '2013-08-22', familyId: 1, sports: [5], teamId: null, positionId: null, venueIds: [1, 2], enrollmentDate: '2025-03-01', status: 'active', profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 3, name: 'Roberto López', document: '79856432', phone: '300-111-9999', email: 'roberto.l@email.com', birthDate: '1980-02-10', familyId: 1, sports: [], enrollmentDate: '2025-01-10', status: 'active', isParent: true, profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 4, name: 'Pedro Sánchez', document: '1007654321', phone: '300-555-6677', email: 'pedro.s@email.com', birthDate: '2010-11-03', familyId: 2, sports: [1, 3], teamId: 2, positionId: 'ST', venueIds: [1], enrollmentDate: '2024-08-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=256&h=256&auto=format&fit=crop', coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' },
  { id: 5, name: 'Ana Rodríguez', document: '1007654322', phone: '311-666-7788', email: 'ana.r@email.com', birthDate: '2012-04-18', familyId: 2, sports: [4], teamId: null, positionId: null, venueIds: [2], enrollmentDate: '2025-02-20', status: 'active', profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 6, name: 'Miguel Sánchez', document: '80123456', phone: '318-777-8899', email: 'miguel.s@email.com', birthDate: '1978-09-25', familyId: 2, sports: [3], enrollmentDate: '2024-08-15', status: 'active', isParent: true, profileImage: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 7, name: 'Carolina Ruiz', document: '1009876543', phone: '315-888-9900', email: 'carolina.r@email.com', birthDate: '2009-01-30', familyId: 3, sports: [2, 4], teamId: null, positionId: null, enrollmentDate: '2024-06-01', status: 'active', profileImage: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 8, name: 'Tomás Ruiz', document: '1009876544', phone: '315-888-9901', email: 'tomas.r@email.com', birthDate: '2014-07-12', familyId: 3, sports: [1], teamId: 1, positionId: 'CB1', venueIds: [1], enrollmentDate: '2025-01-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 9, name: 'Sandra Gómez', document: '52345678', phone: '301-999-0011', email: 'sandra.g@email.com', birthDate: '1982-12-05', familyId: 3, sports: [], enrollmentDate: '2024-06-01', status: 'active', isParent: true, profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 10, name: 'Diego Torres', document: '1003456789', phone: '322-111-2234', email: 'diego.t@email.com', birthDate: '2011-03-28', familyId: 4, sports: [1, 5], teamId: 3, positionId: 'GK', enrollmentDate: '2024-11-01', status: 'active', profileImage: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 11, name: 'Valentina Torres', document: '1003456790', phone: '322-111-2235', email: 'valentina.t@email.com', birthDate: '2008-10-08', familyId: 4, sports: [2, 3], teamId: null, positionId: null, enrollmentDate: '2024-11-01', status: 'active', profileImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 12, name: 'Felipe Herrera', document: '1005678901', phone: '313-222-3345', email: 'felipe.h@email.com', birthDate: '2010-06-20', familyId: 5, sports: [2], teamId: null, positionId: null, venueIds: [1], enrollmentDate: '2025-02-01', status: 'active', profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 13, name: 'Isabella Herrera', document: '1005678902', phone: '313-222-3346', email: 'isabella.h@email.com', birthDate: '2013-09-14', familyId: 5, sports: [4, 5], teamId: null, positionId: null, enrollmentDate: '2025-02-01', status: 'active', profileImage: 'https://images.unsplash.com/photo-1517677129300-07b130802f46?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 14, name: 'Carlos Herrera', document: '71234567', phone: '310-333-4456', email: 'carlos.h@email.com', birthDate: '1975-05-30', familyId: 5, sports: [], enrollmentDate: '2025-02-01', status: 'active', isParent: true, profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 15, name: 'Martín Vargas', document: '1002345678', phone: '300-444-5567', email: 'martin.v@email.com', birthDate: '2009-12-01', familyId: null, sports: [1, 2, 5], teamId: null, positionId: null, enrollmentDate: '2024-03-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 16, name: 'Camila Díaz', document: '1004567890', phone: '319-555-6678', email: 'camila.d@email.com', birthDate: '2011-02-14', familyId: null, sports: [3, 4], teamId: null, positionId: null, enrollmentDate: '2025-01-20', status: 'active', profileImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 17, name: 'Andrés Mendoza', document: '1006789012', phone: '316-666-7789', email: 'andres.m@email.com', birthDate: '2010-07-07', familyId: null, sports: [1], teamId: null, positionId: null, enrollmentDate: '2024-09-01', status: 'inactive', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 18, name: 'Lucía Romero', document: '1008901234', phone: '305-777-8890', email: 'lucia.r@email.com', birthDate: '2012-11-25', familyId: null, sports: [2, 5], teamId: null, positionId: null, enrollmentDate: '2025-01-05', status: 'active', profileImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 19, name: 'Santiago Morales', document: '1001112233', phone: '317-888-9901', email: 'santiago.m@email.com', birthDate: '2008-04-18', familyId: null, sports: [2, 3], teamId: null, positionId: null, enrollmentDate: '2024-05-10', status: 'active', profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 20, name: 'Gabriela Castro', document: '1003344556', phone: '312-999-0012', email: 'gabriela.c@email.com', birthDate: '2013-06-30', familyId: null, sports: [4], teamId: null, positionId: null, enrollmentDate: '2025-02-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 21, name: 'Mateo López', document: '1001112244', phone: '317-888-9902', email: 'mateo.l@email.com', birthDate: '2008-05-20', familyId: null, sports: [1], teamId: 1, positionId: 'CB2', enrollmentDate: '2024-06-10', status: 'active', profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 22, name: 'Daniela Ortiz', document: '1002223344', phone: '318-999-0011', email: 'daniela.o@email.com', birthDate: '2009-03-15', familyId: null, sports: [1], teamId: 1, positionId: 'LB', enrollmentDate: '2024-07-12', status: 'active', profileImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 23, name: 'Nicolás Silva', document: '1003334455', phone: '319-000-1122', email: 'nicolas.s@email.com', birthDate: '2010-08-25', familyId: null, sports: [1], teamId: 1, positionId: 'RB', enrollmentDate: '2024-08-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 24, name: 'Sofía Méndez', document: '1004445566', phone: '320-111-2233', email: 'sofia.m@email.com', birthDate: '2011-01-10', familyId: null, sports: [1], teamId: 1, positionId: 'LM', enrollmentDate: '2024-09-18', status: 'active', profileImage: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 25, name: 'Samuel Rojas', document: '1005556677', phone: '321-222-3344', email: 'samuel.r@email.com', birthDate: '2008-12-05', familyId: null, sports: [1], teamId: 1, positionId: 'CM1', enrollmentDate: '2024-10-20', status: 'active', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 26, name: 'Valeria Peña', document: '1006667788', phone: '322-333-4455', email: 'valeria.p@email.com', birthDate: '2009-11-22', familyId: null, sports: [1], teamId: 1, positionId: 'CM2', enrollmentDate: '2024-11-25', status: 'active', profileImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 27, name: 'Lucas Giraldo', document: '1007778899', phone: '323-444-5566', email: 'lucas.g@email.com', birthDate: '2010-06-30', familyId: null, sports: [1], teamId: 1, positionId: 'RM', enrollmentDate: '2024-12-01', status: 'active', profileImage: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 28, name: 'Elena Castro', document: '1008889900', phone: '324-555-6677', email: 'elena.c@email.com', birthDate: '2011-04-18', familyId: null, sports: [1], teamId: 1, positionId: 'ST2', enrollmentDate: '2025-01-10', status: 'active', profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 29, name: 'Juan Pablo Marín', document: '1009990011', phone: '325-666-7788', email: 'jp.marin@email.com', birthDate: '2008-09-12', familyId: null, sports: [1], teamId: 1, positionId: null, enrollmentDate: '2025-02-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 30, name: 'Mariana Duarte', document: '1010101010', phone: '326-777-8899', email: 'mariana.d@email.com', birthDate: '2009-07-07', familyId: null, sports: [1], teamId: 1, positionId: null, enrollmentDate: '2025-03-01', status: 'active', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 31, name: 'Esteban Restrepo', document: '1011112233', phone: '327-888-9900', email: 'esteban.r@email.com', birthDate: '2010-02-28', familyId: null, sports: [1], teamId: 2, positionId: 'GK', enrollmentDate: '2024-05-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 32, name: 'Clara Estrada', document: '1012223344', phone: '328-999-0011', email: 'clara.e@email.com', birthDate: '2011-12-05', familyId: null, sports: [1], teamId: 2, positionId: 'CB1', enrollmentDate: '2024-06-20', status: 'active', profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 33, name: 'Bastian Jaramillo', document: '1013334455', phone: '329-000-1122', email: 'bastian.j@email.com', birthDate: '2008-08-10', familyId: null, sports: [1], teamId: 2, positionId: 'CB2', enrollmentDate: '2024-07-25', status: 'active', profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 34, name: 'Inés Cuartas', document: '1014445566', phone: '330-111-2233', email: 'ines.c@email.com', birthDate: '2009-05-30', familyId: null, sports: [1], teamId: 2, positionId: 'LB', enrollmentDate: '2024-08-30', status: 'active', profileImage: 'https://images.unsplash.com/photo-1517677129300-07b130802f46?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 35, name: 'Oscar Villada', document: '1015556677', phone: '331-222-3344', email: 'oscar.v@email.com', birthDate: '2010-10-15', familyId: null, sports: [1], teamId: 2, positionId: 'RB', enrollmentDate: '2024-09-10', status: 'active', profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 36, name: 'Julia Tabares', document: '1016667788', phone: '332-333-4455', email: 'julia.t@email.com', birthDate: '2011-03-25', familyId: null, sports: [1], teamId: 2, positionId: 'CM1', enrollmentDate: '2024-10-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 37, name: 'David Noreña', document: '1017778899', phone: '333-444-5566', email: 'david.n@email.com', birthDate: '2008-01-12', familyId: null, sports: [1], teamId: 2, positionId: 'CM2', enrollmentDate: '2024-11-20', status: 'active', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 38, name: 'Paula Betancourt', document: '1018889900', phone: '334-555-6677', email: 'paula.b@email.com', birthDate: '2009-09-22', familyId: null, sports: [1], teamId: 2, positionId: 'ST', enrollmentDate: '2024-12-15', status: 'active', profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 39, name: 'Kevin Arango', document: '1019990011', phone: '335-666-7788', email: 'kevin.a@email.com', birthDate: '2010-07-08', familyId: null, sports: [1], teamId: 2, positionId: null, enrollmentDate: '2025-01-10', status: 'active', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop' },
  { id: 40, name: 'Luis Fernando', document: '1020202020', phone: '336-777-8899', email: 'luis.f@email.com', birthDate: '2011-11-11', familyId: null, sports: [1], teamId: 2, positionId: null, enrollmentDate: '2025-02-05', status: 'active', profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&h=256&auto=format&fit=crop' },
];

const newUsers = [
  ...mockUsers.map(u => {
    let rawCreatedAt = '2024-01-01';
    let docnum = '100000000' + u.id;
    if (u.id === 5) {
      docnum = '1007654321';
    } else if (u.id === 6) {
      docnum = '1007654322';
    }

    return {
      ...u,
      documentType: 'CC',
      documentNumber: docnum,
      birthDate: '1990-01-01',
      enrollmentDate: '2024-01-01',
      createdAt: rawCreatedAt
    };
  })
];

let nextId = Math.max(...mockUsers.map(u => u.id), 0) + 1;

for (const member of mockMembers) {
  // Use email or document to avoid duplicates when mapping from mockUsers
  if (!newUsers.some(u => u.email === member.email || u.documentNumber === member.document)) {
    newUsers.push({
      id: nextId++,
      name: member.name,
      email: member.email,
      password: member.email.split('@')[0] + '123',
      role: member.isParent ? 'familiar' : 'deportista',
      avatar: member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      phone: member.phone || '',
      status: member.status || 'active',
      profileImage: member.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`,
      documentType: member.document && member.document.length < 9 ? 'TI' : 'CC',
      documentNumber: member.document || '',
      birthDate: member.birthDate || '',
      enrollmentDate: member.enrollmentDate || '',
      createdAt: member.enrollmentDate || '2024-01-01',
      memberOriginalId: member.id, // reference for crosscheck
      familyId: member.familyId || null
    });
  } else {
    // If it exists but is just in the base set, sync fields to make sure it matches
    const existing = newUsers.find(u => u.email === member.email);
    if(existing) {
       existing.documentNumber = member.document || existing.documentNumber;
       existing.documentType = member.document && member.document.length < 9 ? 'TI' : 'CC';
       existing.birthDate = member.birthDate || existing.birthDate;
       existing.enrollmentDate = member.enrollmentDate || existing.enrollmentDate;
       existing.createdAt = member.enrollmentDate || existing.createdAt;
    }
  }
}

let res = `export const mockUsers = ${JSON.stringify(newUsers, null, 2).replace(/"([^(")"]+)":/g, "$1:")};`;
fs.writeFileSync('C:/Users/santi/OneDrive/Escritorio/Proyectos/Plataforma Deportiva Test/frontend/src/newUsers.js', res);
console.log('done');
