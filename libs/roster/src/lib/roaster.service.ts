import { Injectable } from '@angular/core';
import { ApiService } from '@realworld/core/http-client';
import { Observable } from 'rxjs';
import { RosterResponse } from '@realworld/core/api-types';

@Injectable({ providedIn: 'root' })
export class RosterService {
  constructor(private apiService: ApiService) {}

  getRoster(): Observable<RosterResponse[]> {
    return this.apiService.get<RosterResponse[]>('/users/roster');
  }
}
