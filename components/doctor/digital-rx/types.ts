export interface DigitalRxModule {
  Form: React.FC<{
    value: any;
    onChange: (v: any) => void;
    bpHistory?: any[];
  }>;

  Preview: React.FC<{ value: any }>;

  Renderer: React.FC<{ record: any }>;

  toCanonical: (value: any) => any;
}
