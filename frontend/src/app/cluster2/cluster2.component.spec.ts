import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Cluster2Component } from './cluster2.component';

describe('Cluster2Component', () => {
  let component: Cluster2Component;
  let fixture: ComponentFixture<Cluster2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Cluster2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Cluster2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
