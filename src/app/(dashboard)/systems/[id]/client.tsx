'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient, isDemo } from '@/lib/supabase/client'
import { DEMO_SYSTEMS, DEMO_HOUSES, DEMO_MAINTENANCE, DEMO_MASTERS, DEMO_EXPENSES } from '@/lib/demo-data'