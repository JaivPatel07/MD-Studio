export const HUES = ['--blue','--green','--yellow','--red'];
export const MAX_FILE_SIZE_MB = 10;
export const STORAGE_KEY = 'marginalia:files';
export const FOLDERS_STORAGE_KEY = 'mdstudio:folders';
export const PREFS_KEY = 'mdstudio:preferences';

export const DEFAULT_FOLDERS = [
  { id: 'work', name: 'Work', color: '--blue' },
  { id: 'personal', name: 'Personal', color: '--green' },
  { id: 'projects', name: 'Projects', color: '--yellow' }
];

export const state = {
  files: [], // {id, name, content, updatedAt, starred?: boolean, folderId?: string | null}
  folders: [], // {id, name, color?: string, createdAt?: number}
  activeFolderId: 'all', // 'all' | 'unfiled' | folderId
  activeId: null,
  saveTimer: null,
  isDirty: false,
  syncScroll: true,
  zenMode: false,
  showOutline: false,
  sortOrder: 'updated', // 'updated' | 'name' | 'size'
  starredOnly: false,
  editingFolderId: null, // used when editing/renaming a folder

  get activeFile() {
    return this.files.find(f => f.id === this.activeId);
  },

  get activeFolder() {
    if (this.activeFolderId === 'all' || this.activeFolderId === 'unfiled') return null;
    return this.folders.find(f => f.id === this.activeFolderId) || null;
  }
};
