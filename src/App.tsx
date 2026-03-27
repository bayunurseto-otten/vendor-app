import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import VendorFormPage from './pages/VendorFormPage';
import DocumentPreviewPage from './pages/DocumentPreviewPage';
import FormBuilderPage from './pages/FormBuilderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vendor/new" element={<VendorFormPage />} />
          <Route path="/vendor/:id/edit" element={<VendorFormPage />} />
          <Route path="/vendor/:id/document" element={<DocumentPreviewPage />} />
          <Route path="/form-builder" element={<FormBuilderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
