'use client';

import { SpreadsheetProvider } from '@/state/spreadsheet-context';
import Toolbar from '@/components/spreadsheet/Toolbar';
import StatusBar from '@/components/spreadsheet/StatusBar';
import Grid from '@/components/spreadsheet/Grid';
import SheetTabs from '@/components/spreadsheet/SheetTabs';
import FindReplaceDialog from '@/components/spreadsheet/FindReplaceDialog';
import ConditionalFormatDialog from '@/components/spreadsheet/ConditionalFormatDialog';
import OnboardingTour from '@/components/spreadsheet/OnboardingTour';
import './spreadsheet.css';

export default function Home() {
  return (
    <SpreadsheetProvider>
      <div className="sf-app">
        <Toolbar />
        <Grid />
        <SheetTabs />
        <StatusBar />
        <FindReplaceDialog />
        <ConditionalFormatDialog />
        <OnboardingTour />
      </div>
    </SpreadsheetProvider>
  );
}
