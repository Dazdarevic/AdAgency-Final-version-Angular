import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin service/admin.service';
import * as L from 'leaflet';

declare global {
  interface Window {
    L: any;
  }
}

@Component({
  selector: 'map',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  private map: any;
  private L: any;

  selectedGrad: string = "Novi Pazar";
  selectedPanoInfo: string = '';
  selectedPanoZone: string = '';
  selectedImg: string = 'https://www.w3schools.com/w3images/lights.jpg';

  constructor(private adminService: AdminService) { }

  ngAfterViewInit(): void {
    // Proveravamo da li window postoji
      this.initMap();
  }

  private initMap(): void {
    this.L = L; // Koristimo globalni L objekat
    if (!this.L) {
        console.error('Leaflet nije učitan.');
        return;
    }

    const coordinates = this.getGradCoordinates();

    this.map = this.L.map('map', {
        center: [coordinates.lat, coordinates.lng],
        zoom: 15
    });

    this.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Dodajte setTimeout da osigurate da se svi elementi pravilno učitavaju
    setTimeout(() => {
        this.map.invalidateSize(); // Ova metoda osvežava dimenzije mape
    }, 0);

    this.addLegend();
    this.getReklamniPanoi();
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

  onGradChange(): void {
    if (!this.map) return;
    const coordinates = this.getGradCoordinates();
    this.map.setView([coordinates.lat, coordinates.lng], 15);
    this.getReklamniPanoi();
    this.selectedImg = 'https://www.w3schools.com/w3images/lights.jpg';
    this.selectedPanoInfo = '';
    this.selectedPanoZone = '';
  }

  private getReklamniPanoi(): void {
    this.adminService.getReklamniPanoiIzGrada(this.selectedGrad).subscribe(
      (data) => {
        console.log('Podaci:', data);
        this.addMarkers(data);
      },
      (error) => {
        console.error('Greška pri uzimanju podataka:', error);
      }
    );
  }

  private addMarkers(data: any[]): void {
    if (!this.L || !this.map) return;

    // Uklanjamo postojeće markere
    this.map.eachLayer((layer: any) => {
      if (layer instanceof this.L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    data.forEach(pano => {
      const latitude = parseFloat(pano.pano.latitude);
      const longitude = parseFloat(pano.pano.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        console.error('Nevalidne koordinate za pano:', pano);
        return;
      }

      // Logika za određivanje boje markera na osnovu procenatZauzetosti
      let iconColor = 'green'; // Podrazumevano zelena boja
      const zauzetost = pano.procenatZauzetosti;

      if (zauzetost === 0) {
        iconColor = 'red'; // Crvena ako je zauzetost 0%
      } else if (zauzetost > 0 && zauzetost <= 5) {
        iconColor = 'orange'; // Narandžasta ako je zauzetost između 0% i 5%
      } else if (zauzetost > 5) {
        iconColor = 'green'; // Zelena ako je zauzetost iznad 5%
      }

      // Prikazujemo sve relevantne informacije o panu
      const title = `
        <strong>Adresa:</strong> ${pano.pano.adresa}<br>
        <strong>Osvetljenost:</strong> ${pano.pano.osvetljenost}<br>
        <strong>Cena:</strong> ${pano.pano.cijena} RSD<br>
        <strong>Procenat zauzetosti:</strong> ${pano.procenatZauzetosti}%<br>
        <strong>Broj dana zauzetosti:</strong> ${pano.brojDanaZauzetosti} dana
      `;
      const zona = `${pano.pano.grad} - ${pano.pano.zona}`;
      const slika = `${pano.pano.urlSlike}`;

      const icon = this.L.icon({
        iconUrl: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${iconColor}" viewBox="0 0 20 20"><path d="M10 0C7.79 0 6 1.79 6 4c0 3.33 4 7 4 7s4-3.67 4-7c0-2.21-1.79-4-4-4zm0 15c-3.33 0-6 2.67-6 6 0 1.35 1.07 2.4 2.4 2.4h7.2C16.93 23 18 21.95 18 20.6c0-3.33-2.67-6-6-6z"/></svg>`,
        iconSize: [20, 20]
      });
      const title2 = `
      Adresa: ${pano.pano.adresa}
      Osvetljenost: ${pano.pano.osvetljenost}
      Cena: ${pano.pano.cijena} RSD
      Procenat zauzetosti:${pano.procenatZauzetosti}%
      Broj dana zauzetosti: ${pano.brojDanaZauzetosti} dana
    `;
      // Dodajemo marker na mapu i povezujemo ga sa pop-up-om
      this.L.marker([latitude, longitude], { icon })
        .addTo(this.map)
        .bindPopup(title) // Pop-up koji prikazuje detalje panoa
        .on('click', () => {
          // Ažuriramo informacije u komponenti nakon što kliknemo na marker
          // this.selectedPanoInfo = title2;
          this.selectedPanoZone = zona;
          this.selectedImg = slika;
        });
    });
}



  private addLegend(): void {
    if (!this.L || !this.map) return;

    const legend = this.L.control({ position: 'topright' });

    legend.onAdd = () => {
      const div = this.L.DomUtil.create('div', 'info legend');
      const colors = ['red', 'orange', 'green'];
      const labels = [
        '<span style="color:red;">Najmanje zauzete lokacije</span>',
        '<span style="color:orange;">Srednje zauzete lokacije</span>',
        '<span style="color:green;">Najzauzetije lokacije</span>'
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
}
