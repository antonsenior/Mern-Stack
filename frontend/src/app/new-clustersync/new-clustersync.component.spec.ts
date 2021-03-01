import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewClustersyncComponent } from './new-clustersync.component';

describe('NewClustersyncComponent', () => {
  let component: NewClustersyncComponent;
  let fixture: ComponentFixture<NewClustersyncComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewClustersyncComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewClustersyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
