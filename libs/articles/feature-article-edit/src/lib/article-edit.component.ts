import { DynamicFormComponent, Field, formsActions, ListErrorsComponent, ngrxFormsQuery } from '@realworld/core/forms';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { articleActions, articleEditActions, articleQuery } from '@realworld/articles/data-access';
import { Router } from '@angular/router';

const structure: Field[] = [
  {
    type: 'INPUT',
    name: 'title',
    placeholder: 'Article Title',
    validator: [Validators.required],
  },
  {
    type: 'INPUT',
    name: 'description',
    placeholder: "What's this article about?",
    validator: [Validators.required],
  },
  {
    type: 'TEXTAREA',
    name: 'body',
    placeholder: 'Write your article (in markdown)',
    validator: [Validators.required],
  },
  {
    type: 'INPUT',
    name: 'tagList',
    placeholder: 'Enter Tags',
    validator: [],
  },
];

const coAuthorForm = {
  type: 'INPUT',
  name: 'coAuthors',
  placeholder: 'Other authors’ email (comma-separated)',
  validator: [],
};

@UntilDestroy()
@Component({
  selector: 'cdt-article-edit',
  standalone: true,
  templateUrl: './article-edit.component.html',
  styleUrls: ['./article-edit.component.css'],
  imports: [DynamicFormComponent, ListErrorsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleEditComponent implements OnInit, OnDestroy {
  structure$ = this.store.select(ngrxFormsQuery.selectStructure);
  data$ = this.store.select(ngrxFormsQuery.selectData);
  mode: string = '';

  constructor(private readonly store: Store, private readonly router: Router) {}

  ngOnInit() {
    const urlSegments = this.router.url.split('/');
    this.mode = urlSegments.length > 2 ? 'edit' : 'create';

    this.store.dispatch(
      formsActions.setStructure({ structure: this.mode === 'edit' ? [...structure, coAuthorForm] : structure }),
    );

    this.store
      .select(articleQuery.selectData)
      .pipe(untilDestroyed(this))
      .subscribe((article) => this.store.dispatch(formsActions.setData({ data: article })));
  }

  separateEmails(emails: string): string[] {
    if (typeof emails === 'string') {
      return emails.split(',').map((email: string) => email.trim());
    }
    return [];
  }

  updateForm(changes: any) {
    changes.tagList = this.splitTagList(changes.tagList);
    if (this.mode === 'edit' && changes.coAuthors) {
      changes.coAuthors = this.separateEmails(changes.coAuthors);
    }
    this.store.dispatch(formsActions.updateData({ data: changes }));
  }

  submit() {
    this.store.dispatch(articleEditActions.publishArticle());
  }

  ngOnDestroy() {
    this.store.dispatch(formsActions.initializeForm());
  }

  splitTagList(tagList: string | string[]): string[] {
    if (typeof tagList === 'string') {
      return tagList.split(',').map((tag: string) => tag.trim());
    }

    if (Array.isArray(tagList)) {
      return tagList;
    }
    return [];
  }
}
