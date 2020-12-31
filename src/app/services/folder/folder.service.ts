import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { FileSystem } from '../../core/io/file-system';
import { Logger } from '../../core/logger';
import { Folder } from '../../data/entities/folder';
import { BaseFolderRepository } from '../../data/repositories/base-folder-repository';
import { BaseSnackBarService } from '../snack-bar/base-snack-bar.service';
import { BaseFolderService } from './base-folder.service';
import { FolderModel } from './folder-model';
import { SubfolderModel } from './subfolder-model';

@Injectable({
  providedIn: 'root'
})
export class FolderService implements BaseFolderService {
  private foldersChanged: Subject<void> = new Subject();

  constructor(
    private folderRepository: BaseFolderRepository,
    private logger: Logger,
    private snackBarService: BaseSnackBarService,
    private fileSystem: FileSystem) { }

  public foldersChanged$: Observable<void> = this.foldersChanged.asObservable();

  public onFoldersChanged(): void {
    this.foldersChanged.next();
  }

  public async addFolderAsync(path: string): Promise<void> {
    const existingFolder: Folder = this.folderRepository.getFolderByPath(path);

    if (existingFolder == undefined) {
      const newFolder: Folder = new Folder(path);
      await this.folderRepository.addFolder(newFolder);
      this.logger.info(`Added folder with path '${path}'`, 'FolderService', 'addNewFolderAsync');
      this.onFoldersChanged();
    } else {
      await this.snackBarService.folderAlreadyAddedAsync();
      this.logger.info(`Folder with path '${path}' was already added`, 'FolderService', 'addNewFolderAsync');
    }
  }

  public getFolders(): FolderModel[] {
    const folders: Folder[] = this.folderRepository.getFolders();

    if (folders != undefined) {
      return folders.map(x => new FolderModel(x));
    }

    return [];
  }

  public async getSubfoldersAsync(rootFolder: FolderModel, subfolder: SubfolderModel): Promise<SubfolderModel[]> {
    // If no root folder is provided, return no subfolders.
    if (rootFolder == undefined) {
      return [];
    }

    const subfolders: SubfolderModel[] = [];
    let directories: string[] = [];

    if (subfolder == undefined) {
      // If no subfolder is provided, return the subfolders of the root folder.
      try {
        if (this.fileSystem.pathExists(rootFolder.path)) {
          directories = await this.fileSystem.getDirectoriesInDirectoryAsync(rootFolder.path);
        }
      } catch (e) {
        this.logger.error(`Could not get directories for root folder. Error: ${e.message}`, 'FolderService', 'getSubfoldersAsync');
      }
    } else {
      // If a subfolder is provided, return the subfolders of the subfolder.
      try {
        if (this.fileSystem.pathExists(subfolder.path)) {
          let subfolderPathToBrowse: string = subfolder.path;

          // If the ".." subfolder is selected, go to the parent folder.
          if (subfolder.isGoToParent) {
            subfolderPathToBrowse = this.fileSystem.getDirectoryPath(subfolder.path);
          }

          // If we're not browsing the root folder, show a folder to go up 1 level.
          if (subfolderPathToBrowse !== rootFolder.path) {
            subfolders.push(new SubfolderModel(subfolderPathToBrowse, true));
          }

          // Return the subfolders of the provided subfolder
          directories = await this.fileSystem.getDirectoriesInDirectoryAsync(subfolderPathToBrowse);
        }
      } catch (e) {
        this.logger.error(`Could not get directories for subfolder. Error: ${e.message}`, 'FolderService', 'getSubfoldersAsync');
      }
    }

    for (const directory of directories) {
      subfolders.push(new SubfolderModel(directory, false));
    }

    return subfolders;
  }

  public deleteFolder(folder: FolderModel): void {
    this.folderRepository.deleteFolder(folder.folderId);
    this.logger.info(`Deleted folder with path '${folder.path}'`, 'FolderService', 'deleteFolder');
    this.onFoldersChanged();
  }

  public setFolderVisibility(folder: FolderModel): void {
    const showInCollection: number = folder.showInCollection ? 1 : 0;
    this.folderRepository.setFolderShowInCollection(folder.folderId, showInCollection);
    this.logger.info(`Set folder visibility: folderId=${folder.folderId}, path '${folder.path}', showInCollection=${showInCollection}`,
      'FolderService',
      'setFolderVisibility');
  }

  public setAllFoldersVisible(): void {
    this.folderRepository.setAllFoldersShowInCollection(1);
    this.logger.info('Set all folders visible',
      'FolderService',
      'setAllFoldersVisible');
  }
}
