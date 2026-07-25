export const HUES = ['--blue','--green','--yellow','--red'];
export const MAX_FILE_SIZE_MB = 10;
export const STORAGE_KEY = 'marginalia:files';

export const state = {
  files: [], // {id, name, content, updatedAt}
  activeId: null,
  saveTimer: null,
  isDirty: false,

  get activeFile() {
    return this.files.find(f => f.id === this.activeId);
  }
};