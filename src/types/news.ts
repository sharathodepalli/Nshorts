export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  category: Category;
  imageUrl: string;
  publishedAt: string;
  source: string;
  url: string;
  isFeatured?: boolean;
  viewCount?: number;
  media?: {
    type: 'image' | 'video';
    url: string;
    caption?: string;
  }[];
  relatedArticles?: {
    id: string;
    title: string;
    url: string;
  }[];
}

export type Category = 
  | 'Technology'
  | 'Business'
  | 'Sports'
  | 'Entertainment'
  | 'Health'
  | 'Science'
  | 'World';

export interface NewsCardProps {
  article: NewsArticle;
  isExpanded: boolean;
  onExpand: (id: string) => void;
  onCollapse: () => void;
}