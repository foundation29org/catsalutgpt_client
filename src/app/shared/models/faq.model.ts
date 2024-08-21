export class FAQ {
    public faqId: number;
    public title: string;
    public content: string;
    public categories: any;

    constructor(faqId: number, title:string, content: string,categories:any) {
      this.faqId = faqId;
      this.title = title;
      this.content = content;
      this.categories=this.categories;
    }
  }
