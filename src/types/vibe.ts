export interface Vibe {
    id: string;
    name: string;
    icon: string;   // emoji or icon name
    color: string;
  }
  
  export interface SpotVibeCount extends Vibe {
    count: number;
  }
  