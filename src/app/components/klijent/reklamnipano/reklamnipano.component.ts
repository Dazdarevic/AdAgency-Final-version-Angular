import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AdminService } from '../../../services/admin service/admin.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { jwtDecode} from 'jwt-decode';
import { PhotoService } from '../../../services/photo service/photo.service';
import { KlijentService } from '../../../services/klijent service/klijent.service';
import { LocalStorageService } from '../../../services/local storage service/local-storage.service';
import * as L from 'leaflet';
import { FormControl } from '@angular/forms';

declare global {
  interface Window {
    L: any;
  }
}

@Component({
  selector: 'reklamnipano',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './reklamnipano.component.html',
  styleUrls: ['./reklamnipano.component.css']
})
export class ReklamnipanoComponent implements OnInit, AfterViewInit {
  selectedGrad: string = "Novi Pazar";
  zadatiDatum: any = '2024-10-08';
  reklamniPanoi: any[] = [];
  displayStyleEdit = "none";
  addForm!: FormGroup;
  id!: number;
  url!: string;
  selectedFile!: any;
  gradovi: string[] = [];
  originalReklamniPanoi: any[] = [];

  private map: any;
  private L: any;
  selectedPanoInfo: string = '';
  selectedPanoZone: string = '';
  selectedImg: string = '';
  gradForm: FormGroup;

  constructor(
    private reklamniPanoiService: AdminService,
    private router: Router,
    private klijentService: KlijentService,
    private photoService: PhotoService,
    private formBuilder: FormBuilder,
    private localStorageService: LocalStorageService
  ) {
    this.gradForm = new FormGroup({
      grad: new FormControl('') // Početna vrednost može biti prazna ili neki grad
    });
  }

  ngOnInit(): void {
      this.fetchReklamniPanoi();
      this.fetchGradovi();
      this.getSlobodniPanoi();

      this.addForm = this.formBuilder.group({
        klijentId: [''],
        reklamniPanoId: [''],
        slika: [''],
        odDatum: [''],
        doDatum: [''],
        opis: [''],
        grad: ['']
      });
      this.initMap();

  }

  ngAfterViewInit(): void {
    // if (typeof window !== 'undefined' && window.L) {
      this.initMap();
    // } else {
    //   console.error('Leaflet nije dostupan.');
    // }
  }

  private initMap(): void {
    this.L = L;
    if (!this.L) {
      console.error('Leaflet nije učitan.');
      return;
    }

    // Provera da li mapa već postoji
    if (this.map) {
      return; // Ako mapa već postoji, ne inicijalizuj je ponovo
    }

    const coordinates = this.getGradCoordinates();

    // Inicijalizacija mape
    this.map = this.L.map('map', {
      center: [coordinates.lat, coordinates.lng],
      zoom: 15
    });

    this.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.getReklamniPanoi();
    this.addLegend();
  }

  onGradChange(): void {
    if (!this.map) return;
    const coordinates = this.getGradCoordinates();
    this.map.setView([coordinates.lat, coordinates.lng], 15);
    this.getReklamniPanoi();
    this.selectedPanoInfo = '';
    this.selectedPanoZone = '';
    this.selectedImg = '';
  }

  private getReklamniPanoi(): void {
    this.reklamniPanoiService.getSlobodniPanoi(this.selectedGrad).subscribe(
      (data) => {
        console.log('Podaci:', data);
        this.addMarkers(data);
      },
      (error) => {
        console.error('Greška pri uzimanju podataka:', error);
      }
    );
  }

  private getGradCoordinates(): { lat: number, lng: number } {
    switch (this.selectedGrad) {
      case "Tutin":
        return { lat: 42.990733, lng: 20.337853 };
      case "Novi Pazar":
      default:
        return { lat: 43.1367, lng: 20.5122 };
    }
  }

  private addMarkers(data: any[]): void {
    if (!this.L || !this.map) return;

    // Uklanjanje postojećih markera sa mape
    this.map.eachLayer((layer: any) => {
      if (layer instanceof this.L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    // Iteracija kroz podatke o panoima
    data.forEach(pano => {
      const latitude = parseFloat(pano.latitude);
      const longitude = parseFloat(pano.longitude);

      // Provera da li su latitude i longitude validni brojevi
      if (!isNaN(latitude) && !isNaN(longitude)) {
        const title = `${pano.adresa}, Osvetljenost: ${pano.osvetljenost}, Cena: ${pano.cijena} RSD`;
        const zona = `${pano.grad} - ${pano.zona}`;
        const imgUrl = `${pano.urlSlike}`;

        const cijena = parseFloat(pano.cijena);
        let iconColor = cijena > 2000 ? 'red' : cijena > 950 ? 'orange' : 'green';

        const icon = this.L.icon({
          iconUrl: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${iconColor}" viewBox="0 0 20 20"><path d="M10 0C7.79 0 6 1.79 6 4c0 3.33 4 7 4 7s4-3.67 4-7c0-2.21-1.79-4-4-4zm0 15c-3.33 0-6 2.67-6 6 0 1.35 1.07 2.4 2.4 2.4h7.2C16.93 23 18 21.95 18 20.6c0-3.33-2.67-6-6-6z"/></svg>`,
        iconSize: [20, 20]
        });

        // Dodavanje markera na mapu
        this.L.marker([latitude, longitude], { icon })
          .addTo(this.map)
          .bindPopup(title)
          .on('click', () => {
            this.selectedImg = imgUrl;
            this.selectedPanoInfo = title;
            this.selectedPanoZone = zona;
          });
      } else {
        // Ako koordinate nisu validne, loguje se problematičan pano
        console.error('Pano nema validne koordinate:', pano);
      }
    });
  }

  private addLegend(): void {
    if (!this.L || !this.map) return;

    const legend = this.L.control({ position: 'topright' });

    legend.onAdd = () => {
      const div = this.L.DomUtil.create('div', 'info legend');
      const colors = ['red', 'orange', 'green'];
      const labels = [
        '<span style="color:red;">Najskuplje lokacije</span>',
        '<span style="color:orange;">Srednje skupe lokacije</span>',
        '<span style="color:green;">Jeftine lokacije</span>'
      ];

      div.innerHTML = '<h4 style="margin: 0;">Legenda</h4>';
      div.style.cssText = 'background-color: white; padding: 10px; border-radius: 5px; border: 2px solid rgba(0, 0, 0, 0.5);';

      colors.forEach((color, index) => {
        div.innerHTML += `<i style="background:${color};"></i> ${labels[index]}<br>`;
      });

      return div;
    };

    legend.addTo(this.map);
  }

  getSlobodniPanoi(): void {
    this.klijentService.getSlobodniPanoi(this.zadatiDatum, this.selectedGrad)
      .subscribe((response: any) => {
        this.reklamniPanoi = response;
        console.log("SLOBODNI", this.reklamniPanoi);
        if (this.map && this.L) {
          this.addMarkers(this.reklamniPanoi);
        }
      }, error => {
        this.fetchReklamniPanoi();
        console.error('Greška prilikom preuzimanja panoa', error);
      });
  }

  onDatumChange(event: any) {
    this.zadatiDatum = event;
    this.getSlobodniPanoi();
  }

  fetchReklamniPanoi(): void {
    this.reklamniPanoiService.getReklamniPanoiBezReklame().subscribe(
      data => {
        this.reklamniPanoi = data;
        this.originalReklamniPanoi = data;
        if (this.map && this.L) {
          this.addMarkers(data);
        }
      },
      error => {
        console.error('Greška prilikom dohvatanja reklamnih panoa:', error);
      }
    );
  }

  fetchGradovi(): void {
    this.reklamniPanoiService.getGradovi().subscribe(
      data => {
        this.gradovi = data;
      },
      error => {
        console.error('Greška prilikom dohvatanja gradova:', error);
      }
    );
  }

  deleteReklamniPano(id: number): void {
    this.reklamniPanoiService.deleteReklamniPano(id).subscribe(
      response => {
        console.log('Reklamni pano uspesno obrisan:', response);
        this.fetchReklamniPanoi();
      },
      error => {
        console.error('Greška prilikom brisanja reklamnog panoa:', error);
      }
    );
  }

  openPopup(id: number): void {
    this.id = id;
    this.reklamniPanoiService.getReklamniPanoAdmin(id).subscribe((data: any) => {
      this.addForm.patchValue(data);
      this.displayStyleEdit = 'block';
    });
  }

  closePopupEdit() {
    this.displayStyleEdit = "none";
    this.fetchReklamniPanoi();
  }

  handleSubmit(): void {
    if (this.addForm.valid) {
      const formValue = this.addForm.value;

      const token = this.localStorageService.getItem('token');
      if (token) {
        const decodedToken: any = jwtDecode(token);
        formValue.klijentId = decodedToken?.UserId;
      }

      const data = {
        klijentId: formValue.klijentId,
        reklamniPanoId: this.id,
        urlSlike: this.selectedFile,
        odDatum: formValue.odDatum,
        doDatum: formValue.doDatum,
        opis: formValue.opis,
        status: false,
      };

      console.log(formValue);
      this.klijentService.dodajReklamu(data).subscribe(
        (response) => {
          console.log(' added:', response);
          this.closePopupEdit();
          this.fetchReklamniPanoi();
        },
        (error) => {
          console.error('Error adding:', error);
        }
      );
    }
  }

  getFile(event: any) {
    const file: File = event.target.files[0];
    console.log("file" + file);
    this.uploadPhoto(file);
  }

  uploadPhoto(file: File) {
    this.photoService.sendPhoto(file).subscribe(
      (response) => {
        this.selectedFile = response.secureUrl;
        console.log("slika", this.selectedFile);
      },
      (error) => {
        console.log("Error " + error);
      }
    );
  }
}
