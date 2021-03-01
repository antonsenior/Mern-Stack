import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClustersyncComponent } from './clustersync.component';

describe('ClustersyncComponent', () => {
  let component: ClustersyncComponent;
  let fixture: ComponentFixture<ClustersyncComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClustersyncComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClustersyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
