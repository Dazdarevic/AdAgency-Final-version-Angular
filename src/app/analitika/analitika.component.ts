import { AdminService } from './../services/admin service/admin.service';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'analitika',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useFactory: () => ({ echarts: () => import('echarts') })
    }
  ],
  templateUrl: './analitika.component.html',
  styleUrls: ['./analitika.component.css']
})
export class AnalitikaComponent implements OnInit {
  chartOption: EChartsOption = {};
  cityOccupancyChartOption: EChartsOption = {};
  selectedYear: number = new Date().getFullYear(); // Trenutna godina
  years: number[] = []; // Lista godina

  constructor(
    private analitikaService: AdminService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ucitajPodatke();
      this.ucitajPodatkeGradova();
    }
  }

  onYearChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedYear = +selectElement.value; // Konvertujte vrednost u broj
    console.log("sele", this.selectedYear);
    this.ucitajPodatke(); // Učitajte nove podatke
    this.ucitajPodatkeGradova(); // Učitajte nove podatke za gradove
  }

  ucitajPodatke() {
    if (isPlatformBrowser(this.platformId)) { // Proveri da li se kod izvršava u browseru
      this.analitikaService.getZauzetostPanoa(this.selectedYear).subscribe(
        (data: any) => {
          const mjeseci = Object.keys(data);
          const jeftiniPanoi = mjeseci.map(m => data[m]['Jeftini panoi']);
          const srednjeSkupiPanoi = mjeseci.map(m => data[m]['Srednje skupi panoi']);
          const skupiPanoi = mjeseci.map(m => data[m]['Skupi panoi']);

          this.chartOption = {
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            legend: {
              data: ['Jeftini panoi', 'Srednje skupi panoi', 'Skupi panoi']
            },
            xAxis: {
              data: mjeseci
            },
            yAxis: {
              type: 'value',
              max: 100
            },
            series: [
              {
                name: 'Jeftini panoi',
                type: 'bar',
                data: jeftiniPanoi
              },
              {
                name: 'Srednje skupi panoi',
                type: 'bar',
                data: srednjeSkupiPanoi
              },
              {
                name: 'Skupi panoi',
                type: 'bar',
                data: skupiPanoi
              }
            ]
          };
        },
        error => {
          console.error('Došlo je do greške pri učitavanju podataka:', error);
        }
      );
    }
  }
  ucitajPodatkeGradova() {
    if (isPlatformBrowser(this.platformId)) { // Proveri da li se kod izvršava u browseru
      this.analitikaService.getAnalitikaZauzetostPoGradovima(this.selectedYear).subscribe(
        (data: any) => {
          const gradovi = Object.keys(data);
          const mjeseci = Object.keys(data[gradovi[0]]);

          this.cityOccupancyChartOption = {
            title: {
              text: ''
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            legend: {
              data: gradovi
            },
            xAxis: {
              data: mjeseci
            },
            yAxis: {
              type: 'value'
            },
            series: gradovi.map(grad => ({
              name: grad,
              type: 'bar',
              stack: 'total',
              data: mjeseci.map(mjesec => data[grad][mjesec])
            }))
          };
        },
        error => {
          console.error('Došlo je do greške pri učitavanju podataka o gradovima:', error);
        }
      );
    }
  }
}
