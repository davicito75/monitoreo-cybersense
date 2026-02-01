import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MonitorDetail from '../MonitorDetail';
import { getT } from '../../contexts/IntlContext';

vi.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MonitorDetail', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it('renders and shows SLA selector', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/monitors/1')) {
        return Promise.resolve({ data: { id: 1, name: 'Test', type: 'http' } });
      }
      if (url.includes('/checks')) {
        return Promise.resolve({ data: { items: [], total: 0 } });
      }
      if (url.includes('/sla')) {
        return Promise.resolve({ data: { report: { '7': { uptime: 100, total: 10, up: 10, down: 0 } } } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<MonitorDetail id={1} onBack={() => {}} />);

  await waitFor(() => expect(screen.getByText(getT('en')('sla'))).toBeInTheDocument());
  expect(screen.getAllByText('7d').length).toBeGreaterThanOrEqual(1);
  });
});
