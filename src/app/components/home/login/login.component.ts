import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { LoginServiceService } from '../../../services/login service/login.service';
import { LocalStorageService } from '../../../services/local storage service/local-storage.service';

@Component({
  selector: 'login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  role: any;
  loginForm!: FormGroup;
  message = '';

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginServiceService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private localStorageService: LocalStorageService
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loginForm = this.formBuilder.group({
        userEmail: ['', [Validators.required, Validators.email]],
        userPassword: ['', [Validators.required]],
      });
    }
  }

  login() {
    console.log("login() funkcija pozvana.");

    if (this.loginForm.valid) { // Proverite validnost forme
      console.log("Forma je validna.");

      const formValue = this.loginForm.value;
      console.log("User Email: " + formValue.userEmail + " User Password: " + formValue.userPassword);

      const user = {
        Email: formValue.userEmail,
        Password: formValue.userPassword,
      };

      this.loginService.login(user).subscribe({
        next: (res: any) => {
          console.log("Odgovor sa servera: ", res);
          const accessToken = res.accessToken;

          this.localStorageService.setItem('token', accessToken); // Koristi LocalStorageService
          console.log("Radii", accessToken);

          const token = this.localStorageService.getItem('token'); // Koristi LocalStorageService

          if (token) {
            const decodedToken: any = jwtDecode(token);
            console.log(decodedToken);
            this.role = decodedToken?.UserRole;
          }
          console.log("ULOGA: " + this.role);

          if (this.role === "Admin" || this.role === "Klijent" || this.role === "Posetilac") {
            this.router.navigate(['/myprofile']);
          }
        },
        error: (err) => {
          this.message = 'Nevalidni podaci.';
          console.log("Greška sa servera: ", err);
        }
      });
    } else {
      this.message = 'Molimo vas da popunite sve obavezne informacije.'; // Poruka za korisnika
      console.log("Forma nije validna.");
    }
  }
}
