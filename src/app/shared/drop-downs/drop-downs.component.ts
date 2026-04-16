import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { IonItem, IonSelect, IonSelectOption } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-drop-downs',
  templateUrl: './drop-downs.component.html',
  styleUrls: ['./drop-downs.component.scss'],
  standalone: true,
  imports: [IonItem, IonSelect, IonSelectOption, CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None
})
export class DropDownsComponent implements OnInit {

  @Input() label: string = '';
  @Input() placeholder: string = 'Select item';
  @Input() options: any[] = [];
  @Input() selectedValue: any;
  @Input() disabled: boolean = false;
  @Input() active: boolean = true;
  @Input() stepNumber: number = 1;
  // Triggering rebuild

  @Output() selectionChange = new EventEmitter<any>();

  constructor() { }

  ngOnInit() { }

  onIonChange(event: any) {
    this.selectionChange.emit(event.detail.value);
  }

}
