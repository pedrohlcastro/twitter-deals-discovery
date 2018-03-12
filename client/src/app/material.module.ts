import { NgModule } from '@angular/core';
import {MatButtonModule, MatCheckboxModule, MatSelectModule, MatCardModule, MatIconModule} from '@angular/material';


@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatSelectModule, MatCardModule, MatIconModule],
  exports: [MatButtonModule, MatCheckboxModule, MatSelectModule, MatCardModule, MatIconModule ],
})
export class MaterialModule { }
