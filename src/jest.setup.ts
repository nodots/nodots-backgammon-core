import { setConsoleEnabled, setIncludeCallerInfo, setLogLevel } from './utils/logger'

// Silence logs globally in test runs to keep CI output clean
setConsoleEnabled(false)
setIncludeCallerInfo(false)
setLogLevel('error')

