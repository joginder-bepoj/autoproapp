// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // api_base_url: "https://api.americankeysupply.com/V1/",
  api_base_url: "/V1/",
  autopro_base_url:"/autoApi/",
  // autopro_base_url:"https://autoproapp.com/autoApi/",
  api_firebase_url: "https://autoproapp2017.firebaseio.com/",
  
  firebase: {
    apiKey: "AIzaSyDwsJxPwwJ3p5z3I-GTLY7QwX7RaMZ3yUY",
    // apiKey: "AIzaSyA1kkLsRv7v_tTafk5aCQWnXeWV_plC5_k",
    authDomain: "autoproapp2017.firebaseapp.com",
    databaseURL: "https://autoproapp2017.firebaseio.com",
    projectId: "autoproapp2017",
    storageBucket: "autoproapp2017.appspot.com",
    messagingSenderId: "988140303282",
    appId: "1:988140303282:web:e04771f155fc77ec"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
