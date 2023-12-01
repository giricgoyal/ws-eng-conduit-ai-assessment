import { Injectable } from '@angular/core';
import { ComponentStore, OnStateInit, tapResponse } from '@ngrx/component-store';
import { RosterResponse } from '@realworld/core/api-types/src';
import { RosterService } from '@realworld/roster/src/lib/roaster.service';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';

export interface RosterState {
  isLoading: boolean;
  error: string | null;
  roster: RosterResponse[];
}

@Injectable()
export class RosterStoreService extends ComponentStore<RosterState> implements OnStateInit {
  constructor(private readonly rosterService: RosterService) {
    super({ isLoading: false, roster: [], error: null });
  }

  ngrxOnStateInit() {
    this.getRoster();
  }

  roster$ = this.select((store) => store.roster);

  readonly getRoster = this.effect<void>(
    pipe(
      tap(() => this.patchState({ isLoading: true })),
      switchMap(() =>
        this.rosterService.getRoster().pipe(
          tap((roster) => this.patchState({ roster })),
          catchError((error) => {
            this.patchState({ error });
            return of(error);
          }),
        ),
      ),
      tap(() => this.patchState({ isLoading: false })),
    ),
  );
}
