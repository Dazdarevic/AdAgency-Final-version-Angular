import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalitikaComponent } from './analitika.component';

describe('AnalitikaComponent', () => {
  let component: AnalitikaComponent;
  let fixture: ComponentFixture<AnalitikaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalitikaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnalitikaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
