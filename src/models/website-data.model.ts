
export interface PortfolioImage {
  id: string;
  thumbnail: string;
  fullImage: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  titleStyle: ElementStyle;
  images: PortfolioImage[];
  order: number;
  originalSrc?: string;
}

export interface PortfolioData {
  enabled: boolean;
  heading: string;
  headingStyle: ElementStyle;
  items: PortfolioItem[];
}

export interface HeroBanner {
  id:string;
  desktopImage?: string; // WebP data URL
  mobileImage?: string;  // WebP data URL
  aspectRatio?: string;  // auto-calculated, e.g., "1920 / 600"
  link?: string;
}

export interface ElementStyle {
  color?: string;
  opacity?: number;
  fontSize?: string;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: string;
  lineHeight?: string;
  isGradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

export interface CtaButton {
  text: string;
  link: string;
  style: 'primary' | 'secondary';
}

export interface HeroData {
  banners: HeroBanner[];
}

export interface EditableListItem {
  id: string;
  text: string;
  textStyle: ElementStyle;
}

export interface AboutData {
  enabled: boolean;
  heading: string;
  headingStyle: ElementStyle;
  paragraph: string;
  paragraphStyle: ElementStyle;
  image?: string;
  expertiseHeading?: string;
  expertiseHeadingStyle: ElementStyle;
  expertiseItems?: EditableListItem[];
}

export interface ContactData {
  heading: string;
  headingStyle: ElementStyle;
  paragraph: string;
  paragraphStyle: ElementStyle;
  formspreeId?: string;
}

export interface StatItem {
    id: string;
    value: string;
    valueStyle: ElementStyle;
    label: string;
    labelStyle: ElementStyle;
    suffix: string;
    suffixStyle: ElementStyle;
}

export interface StatsData {
    enabled: boolean;
    sectionHeading: string;
    sectionHeadingStyle: ElementStyle;
    mainStatValue: string;
    mainStatValueStyle: ElementStyle;
    mainStatSuffix: string;
    mainStatSuffixStyle: ElementStyle;
    heading: string; // "Years of Professional..."
    headingStyle: ElementStyle;
    paragraph: string;
    paragraphStyle: ElementStyle;
    ctaText: string;
    ctaLink: string;
    items: StatItem[]; // The 4 grid items
}

export interface ToolItem {
  id: string;
  name: string;
  nameStyle: ElementStyle;
  description: string;
  descriptionStyle: ElementStyle;
  iconSrc: string;
}

export interface ToolsData {
  enabled: boolean;
  heading: string;
  headingStyle: ElementStyle;
  items: ToolItem[];
}

export interface HireMeData {
  enabled: boolean;
  heading: string;
  headingStyle: ElementStyle;
  paragraph1: string;
  paragraph1Style: ElementStyle;
  paragraph2: string;
  paragraph2Style: ElementStyle;
  buttonText: string;
  buttonTextStyle: ElementStyle;
  buttonLink: string;
  highlightText: string;
  highlightTextStyle: ElementStyle;
}

export interface FooterData {
  copyrightText: string;
  copyrightTextStyle: ElementStyle;
}

export interface WebsiteData {
  hero: HeroData;
  about: AboutData;
  contact: ContactData;
  portfolio: PortfolioData;
  stats: StatsData;
  tools: ToolsData;
  hireMe: HireMeData;
  footer: FooterData;
}
