export type MockUser = {
  id: number;
  name: string;
  color: string;
  avatar: string;
};

const getAvatarUrl = (name: string, background: string, color = 'ffffff', size = 96) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background.replace('#', '')}&color=${color.replace('#', '')}&rounded=true&size=${size}`;

export const mockUsers: MockUser[] = [
  { id: 1, name: 'Alex', color: '#ff6b6b', avatar: getAvatarUrl('Alex', 'ff6b6b') },
  { id: 2, name: 'María', color: '#4f6cff', avatar: getAvatarUrl('María', '4f6cff') },
  { id: 3, name: 'Jorge', color: '#ffb703', avatar: getAvatarUrl('Jorge', 'ffb703') },
  { id: 4, name: 'Lucía', color: '#20c997', avatar: getAvatarUrl('Lucía', '20c997') },
  { id: 5, name: 'Sofía', color: '#6f42c1', avatar: getAvatarUrl('Sofía', '6f42c1') },
  { id: 6, name: 'Carlos', color: '#fd7e14', avatar: getAvatarUrl('Carlos', 'fd7e14') },
  { id: 7, name: 'Ana', color: '#ec4899', avatar: getAvatarUrl('Ana', 'ec4899') },
  { id: 8, name: 'David', color: '#0ea5e9', avatar: getAvatarUrl('David', '0ea5e9') },
  { id: 9, name: 'Elena', color: '#14b8a6', avatar: getAvatarUrl('Elena', '14b8a6') },
  { id: 10, name: 'Pablo', color: '#f97316', avatar: getAvatarUrl('Pablo', 'f97316') }
];
