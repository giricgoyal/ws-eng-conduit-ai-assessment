import { Component, OnInit } from '@angular/core';
import { provideComponentStore } from '@ngrx/component-store';
import { RosterStoreService } from '@realworld/roster/src/lib/roaster.store';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'realworld-roster',
  templateUrl: './roster.component.html',
  styleUrls: ['./roster.component.css'],
  providers: [provideComponentStore(RosterStoreService)],
  imports: [CommonModule],
  standalone: true,
})
export class RosterComponent implements OnInit {
  roster$ = this.rosterStore.roster$;

  constructor(private readonly store: Store, private readonly rosterStore: RosterStoreService) {}

  ngOnInit() {}
}
