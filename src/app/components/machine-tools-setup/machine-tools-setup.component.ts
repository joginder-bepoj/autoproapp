import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkOutline,
  constructOutline,
  saveOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { forkJoin, Subject, take, takeUntil } from 'rxjs';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

interface MachineToolChild {
  name: string;
  show: boolean;
  originalShow: boolean;
}

interface MachineToolGroup {
  name: string;
  children: MachineToolChild[];
}

interface MachineToolChange {
  groupName: string;
  child: MachineToolChild;
}

interface MachineToolApiChild {
  childName?: string;
  name?: string;
  show?: boolean;
}

interface MachineToolApiGroup {
  groupName?: string;
  name?: string;
  childList?: MachineToolApiChild[];
  children?: MachineToolApiChild[];
}

const MACHINE_TOOL_GROUPS: Omit<MachineToolGroup, 'children'>[] = [
  { name: 'Decoders' },
  { name: 'Key Cutting' },
  { name: 'Key Programming' },
];

const MACHINE_TOOL_ITEMS: Record<string, string[]> = {
  Decoders: ['Lishi', 'AccuReader', 'EEZ Reader', 'Determinator', 'Try Out Keys'],
  'Key Cutting': [
    'Blitz',
    'Condor',
    'Curtis',
    'Framon',
    'HPC Punch',
    'HPC CodeMax',
    'ITL',
    'Keyline Ninja',
    'Keyline Vise',
    'LKP 3DX Xtreme',
    'Pack A Punch',
    'Sidewinder',
    'Silca Futura',
    'Keyline 994',
  ],
  'Key Programming': [
    'Abrites',
    'AutoProPAD',
    'Hotwire',
    'MVP TCode Smart Pro',
    'SKP1000',
    'SKP900',
    'Smart Box',
    'TKO SDD',
    'True Code',
    'VVDI2',
    'ZED Full',
  ],
};

@Component({
  selector: 'app-machine-tools-setup',
  templateUrl: './machine-tools-setup.component.html',
  styleUrls: ['./machine-tools-setup.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonIcon,
    IonToggle,
    BreadcrumbsComponent,
    FooterComponent,
  ],
})
export class MachineToolsSetupComponent implements OnInit, OnDestroy {
  groups: MachineToolGroup[] = [];
  isSaving = false;

  readonly breadcrumb = [
    { label: 'Settings', url: '/account-settings' },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkOutline,
      constructOutline,
      saveOutline,
      sparklesOutline,
    });
  }

  ngOnInit(): void {
    this.groups = this.createDefaultGroups();
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get enabledCount(): number {
    return this.groups.reduce(
      (count, group) => count + group.children.filter((child) => child.show).length,
      0
    );
  }

  get totalCount(): number {
    return this.groups.reduce((count, group) => count + group.children.length, 0);
  }

  get hasChanges(): boolean {
    return this.groups.some((group) =>
      group.children.some((child) => child.show !== child.originalShow)
    );
  }

  trackByGroup = (_: number, group: MachineToolGroup) => group.name;

  trackByChild = (_: number, child: MachineToolChild) => child.name;

  setGroupVisibility(group: MachineToolGroup, show: boolean): void {
    group.children = group.children.map((child) => ({ ...child, show }));
  }

  saveChanges(): void {
    const userId = this.getUserId();
    if (!userId) {
      this.utilService.showToast('Please log in again to save settings.', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    const changed: MachineToolChange[] = [];
    this.groups.forEach((group) => {
      group.children.forEach((child) => {
        if (child.show !== child.originalShow) {
          changed.push({ groupName: group.name, child });
        }
      });
    });

    if (!changed.length) {
      this.utilService.showToast('No changes to save.', 'primary');
      return;
    }

    this.isSaving = true;
    this.utilService.showLoader();

    forkJoin(
      changed.map(({ groupName, child }) =>
        this.apiService.saveMachineToolSetting(userId, groupName, child.name, child.show)
      )
    ).subscribe({
      next: () => {
        this.groups = this.groups.map((group) => ({
          ...group,
          children: group.children.map((child) => ({
            ...child,
            originalShow: child.show,
          })),
        }));
        this.isSaving = false;
        this.utilService.hideLoader();
        this.utilService.showToast('Machines and tools updated.', 'success');
      },
      error: (err: any) => {
        this.isSaving = false;
        this.utilService.hideLoader();
        const message = this.utilService.parseErrorMessage(err);
        this.utilService.showToast(message || 'Unable to save settings.', 'danger');
      },
    });
  }

  back(): void {
    this.router.navigate(['/account-settings']);
  }

  private loadSettings(): void {
    const userId = this.getUserId();
    if (userId) {
      this.loadUserSettings(userId);
      return;
    }

    this.utilService.showLoader();
    this.apiService.getCustomerProfile().pipe(take(1)).subscribe({
      next: (res: any) => {
        const profile = res?.data ?? res;
        if (profile) this.utilService.setUserProfile(profile);
        this.utilService.hideLoader();

        const loadedUserId = this.getUserId();
        if (loadedUserId) {
          this.loadUserSettings(loadedUserId);
        }
      },
      error: (err: any) => {
        this.utilService.hideLoader();
        const message = this.utilService.parseErrorMessage(err);
        this.utilService.showToast(message || 'Unable to load profile.', 'danger');
      },
    });
  }

  private loadUserSettings(userId: string): void {
    this.utilService.showLoader();
    this.apiService
      .getMachineToolSettings(userId)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (settings: any) => {
          this.applySavedSettings(settings);
          this.utilService.hideLoader();
        },
        error: (err: any) => {
          this.utilService.hideLoader();
          const message = this.utilService.parseErrorMessage(err);
          this.utilService.showToast(message || 'Unable to load machine tool settings.', 'danger');
        },
      });
  }

  private createDefaultGroups(): MachineToolGroup[] {
    return MACHINE_TOOL_GROUPS.map((group) => ({
      name: group.name,
      children: MACHINE_TOOL_ITEMS[group.name].map((name) => ({
        name,
        show: true,
        originalShow: true,
      })),
    }));
  }

  private applySavedSettings(settings: any): void {
    const savedSettings = settings?.data ?? settings;

    if (Array.isArray(savedSettings)) {
      savedSettings.forEach((group: MachineToolApiGroup) => {
        const groupName = group.groupName ?? group.name;
        const children = group.childList ?? group.children ?? [];

        if (!groupName) return;

        children.forEach((child: MachineToolApiChild) => {
          const childName = child.childName ?? child.name;
          if (childName) {
            this.updateChild(groupName, childName, child.show);
          }
        });
      });
      return;
    }

    this.groups = this.groups.map((group) => ({
      ...group,
      children: group.children.map((child) => {
        const savedValue = savedSettings?.[group.name]?.[child.name];
        const show = savedValue === false ? false : true;
        return {
          ...child,
          show,
          originalShow: show,
        };
      }),
    }));
  }

  private updateChild(groupName: string, childName: string, show: boolean | undefined): void {
    this.groups = this.groups.map((group) => {
      if (group.name !== groupName) return group;

      return {
        ...group,
        children: group.children.map((child) => {
          if (child.name !== childName) return child;

          const isVisible = show === false ? false : true;
          return {
            ...child,
            show: isVisible,
            originalShow: isVisible,
          };
        }),
      };
    });
  }

  private getUserId(): string | null {
    const user = this.utilService.getUserProfile();
    return user?.customerID ?? user?.customerId ?? user?.id ?? null;
  }
}
