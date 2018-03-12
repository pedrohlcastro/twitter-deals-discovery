import { Component, OnInit } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';

import 'rxjs/add/operator/map';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  products = ['Celular', 'Notebook'];
  title = 'Twitter-Deals';
  results = true;
  data;

  constructor(private http: Http) { }

  ngOnInit(): void {
    this.results = false;
  }

  searchResults() {
    this.results = true;
    this.callApi().subscribe((res) => {
      this.data = res.results;
      console.log(this.data);
    });
  }

  callApi() {
    return this.http.get('/api/result').map((res) => {
      return res.json();
    });
  }
}
