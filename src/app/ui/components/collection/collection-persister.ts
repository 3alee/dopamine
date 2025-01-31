import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SettingsBase } from '../../../common/settings/settings.base';

@Injectable()
export class CollectionPersister {
    private _selectedTab: string;

    private selectedTabChanged: Subject<void> = new Subject();

    public constructor(private settings: SettingsBase) {
        this.initializeFromSettings();
    }

    public get selectedTab(): string {
        return this._selectedTab;
    }

    public set selectedTab(v: string) {
        this._selectedTab = v;
        this.settings.selectedCollectionTab = v;
        this.selectedTabChanged.next();
    }

    public selectedTabChanged$: Observable<void> = this.selectedTabChanged.asObservable();

    private initializeFromSettings(): void {
        this.selectedTab = this.settings.selectedCollectionTab;
    }
}
