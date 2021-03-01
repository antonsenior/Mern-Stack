import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Cluster1Component } from './cluster1.component';

describe('Cluster1Component', () => {
  let component: Cluster1Component;
  let fixture: ComponentFixture<Cluster1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Cluster1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Cluster1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
