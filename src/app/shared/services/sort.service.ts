import { Injectable } from '@angular/core';
@Injectable()
export class SortService {

  constructor() {}

  GetSortOrder(prop:string) {
      return function(a, b) {
          if (a[prop] > b[prop]) {
              return 1;
          } else if (a[prop] < b[prop]) {
              return -1;
          }
          return 0;
      }
  }

  GetSortOrderNumber(prop:string) {
      return function(a, b) {
          if (parseInt(a[prop]) < parseInt(b[prop])) {
              return 1;
          } else if (parseInt(a[prop]) > parseInt(b[prop])) {
              return -1;
          }
          return 0;
      }
  }

  GetSortOrderCases(prop:string) {
    return function(a, b) {
        var part1 = (a[prop]).substr(1);
        var part2 = (b[prop]).substr(1);
        if (parseInt(part1) > parseInt(part2)) {
            return 1;
        } else if (parseInt(part1) < parseInt(part2)) {
            return -1;
        }
        return 0;
    }
  }

  GetSortOrderInverse(prop:string) {
      return function(a, b) {
          if (a[prop] < b[prop]) {
              return 1;
          } else if (a[prop] > b[prop]) {
              return -1;
          }
          return 0;
      }
  }

  GetSortOrderProms(prop:string) {
      return function(a, b) {
          if (parseInt(a.structure[prop]) > parseInt(b.structure[prop])) {
              return 1;
          }else if(parseInt(a.structure[prop]) < parseInt(b.structure[prop])) {
              return -1;
          }
          return 0;
      }
  }

  GetSortOrderSections(prop:string) {
      return function(a, b) {
          if (parseInt(a.section[prop]) > parseInt(b.section[prop])) {
              return 1;
          }else if(parseInt(a.section[prop]) < parseInt(b.section[prop])) {
              return -1;
          }
          return 0;
      }
  }

  DateSort(prop:string) {
    return function(a, b) {
        if (new Date(b[prop]).getTime() > new Date(a[prop]).getTime()) {
            return 1;
        }else if(new Date(b[prop]).getTime() < new Date(a[prop]).getTime()) {
            return -1;
        }
        return 0;
    }
  }

}
