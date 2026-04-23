import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders sign in on login route', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument();
});



//Test and Document OAuth Integration 
// //Test the entire OAuth integration and update the documentation.
