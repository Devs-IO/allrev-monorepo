import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): Promise<any> {
    return Promise.resolve({ status: 'UP' });
  }
  getHello(): string {
    return `
      <div style="
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 2rem;
      ">
        <h1 style="
          color: #4CAF50;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 2.5rem;
        ">
          <span>🚀</span>
          <span>Hello World!</span>
        </h1>
        <p style="
          color: #2196F3;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        ">
          <span>🛠️</span>
          <span>Bem-vindo ao <strong>AllRev Backend</strong> <small style="
            background: #E3F2FD;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.8rem;
          ">v1.0.6</small></span>
        </p>
      </div>
    `;
  }
}
