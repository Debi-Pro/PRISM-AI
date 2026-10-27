import { ProjectJob } from '../types';

export const INITIAL_PROJECT_PHOTOS: string[] = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBmHLB_076gwaX3iafU9eqDCkErnWN_iRDrOrJy_Lon-m9RnawPxiQrpwv_fDM3CNE_p5Q_f8sZkbGl2q8ZAed4cvpJjoaBQ7Gji_cFROcfTxDEN23unM15TD9-pAHil4XW-IrRVV_MskSNmvGzMxBW5wvMpwTgVjovW9jxMUmtWhYa96SElLtjYdEy21-gzYeSlCoRDuAgwQK871lG3A8IrW7I49rNIq2v_0A6BSb6Yyx3T6oe1QuE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAifMMiQK3wbLsUopJkkMoHa_gCBw9i5do63Tpgws5yYGejf1UsyOnPhsFQglfFSvNNZbsJhqYDzPIOIOmqWhrxgwzyGsOysBoaupAA5M-7ebN-9BDjN4sYqAJ6JzOV9-lmcxxTivt4rTTZFFForhy9FGxiQ4D5Hl4alX93j_zG3qtlk60mwt5212ZtstROHcLbZ6XeJO1DobkWbdpwgY75Ddmt3mqPBpu6D6apxR5qGFpmlsvc9Nz-",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC7xigD6Jxl-YhQgkMgC9JnQNJ88Y91xLsIp9KEGdGbQLbkp03kGH-X6ON9mQ1UY86haRhAjdptTVW17dmMp89p3zwxZm19WF3Omnp_dhC1Kxcx4nqDFH6Rwnsh0P4SsjwcxhGvMwS8HlMxNpAXqWpBeD3WGWJ5QllXBbhRFUsJTnYEV_JMc4rw5Vu_-U597q1xFdjgWan7r8W261KRsm_8S4xhnkxT0wm1l82_9Kt_X-Qx8fkgIWZp",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA9JueZVw-WSlo5jSpqeKiYtQuHOInY1rf-9mGf5tLyEmgw8fy-RnYbTVBPRImNPpAC1EAzY3qGAsx6qXDwxvUEeCgPhSJ8VOyXr-0tOlOjX4EsoYOoIfHmmarC2lW95hagU1BJm6CgqvioayW6mkRf_AP_gQV07x-N7TBkNcVxsDqHUUUp3RPABl9NWvwUPVFEx5u7_Lprue3jwjxTzOSNqVlVxYp895XTT0nM6KgOwQ4gbuTdmkJZ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBawQslZ9j29ZPTXj5vAg9H4NKl86fOMhF5ElsfMo5hg6FS0CUg6XWhOg0CVtuUbfWrQSU8fKo7qnQqWSCvuxqSkq34LKx3aTgTdMBuZDSPQQp3ssDtJ8ICmJjNEducIMQ-NTL4YKm992MBovamaJR2Uav0ZCbP3911vGWAWn_GK4AaYK1C3QIO3xJefhjkmdyn8v1kKHMUH6JPwwhQTsbaBccqac1g_pnjGg9hZHV-IACc_IsiQ5-n",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBRulj09apbM8-YulXgp8IkUxfgRTSJ1lIJqiUc-X2lelqIMVHHVIbopfU64A5oG1xBZD4ZN0Rc6OyNkZudXg2hOsmovEKU8Ib59Sd9JPDfKQ3yX7m7ZbJAivUwJTy-R_op4bOgc_b6Ed5HChV6MGn7Ws0DEXw7AEwyFDVlqhSUmXFXRPwSiJ-cEGPqUbR8JbCsX7_m-frhrnSQvbwH7sVGX1T-DxJ4uBvr-zzuiE_JMhKPSq9UaVGC",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB-jjjyEDZd3dmGqxeBHvp0gFmWklVCTgsBnlmVAwBRm7wkCwc-peSIlpL7qR8_IzB5-jIBdW7vAcmdTbnQpVWs8BFCL0rvdojJW5xNuQYrXqSxUudK8oxxqDQgRvMAUIPZTH6G8MQKT2obeQQz2L3a_AkXkcq9BiAK8rFM8QLjRgzLP-9uCrPGXnOvyj0UJKZQWwBlo2SjHfFvD4Bj_HUshRQXJfKZHUyDydIj1DXMKVHpiHalIvls",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAL9S6W9RlkWdDZNdU9PEj7I-YdeH8aXTF4Ct6-tFudbbUHRfynOSWFAn4T0TbnF5S-aKGwk3-0QmG5hOcO55m7vRCfXbacSGiuC9PtQUWtBlKRPFNkD0MJ6Eg7M8mA82KtB_GcXk4EpWWCaRP_7NdZNTmADSokaAB5DleRclj11qSq_fcQbYtAGbgexpnR-hOWszgcqVWlYHJgfE-sAGfkQUBNU0hMvzhvR3aOpyl3I7AWMihLJI_L",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBfY2F8eGJ_RdKC_Ar9wFbSRHM1OrCrC_mVtufWnAHbAAFR3IgWoqRoRjXkNJYWvZSwCwfUDguhK3Pj-u8ZZRkVFLCOrmbUxnr-hfGTSCROnXb7SrF9OJqxHwVqDFtAolDrReNuBGVUl6L2UniaagPSe1cX-yiw-7QdIVmfg9Nzxa0LBVnMaTQJde6faMW4282fx3YqXtx1HhhjK5gVLZb29nKIwASU2NXNban4qUdwntO_E7gIvMB9",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDZsIJe9aE3x7G4yltFrYai1Hyo2w1yf_mM08n_EBS4UwPHj3-2sJAt7dAt5-miUPR5hUexdQjA02VEAqJZqNjeTS0hu6ioptlkmZw-BNngPi3yA9m0QpT3W65WLR9Y6blKt_eYI3xFN7NxFWMisBuhOX3-iKECKbYl-rUvng5NgZpoDOm0-dXmcz54Ay1fjnSJ4UKkzyhfRaKPtTjmw_CSTNb7XngRoTi2c3svQcoGksUkSYMGKmu_",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-u_zFJ-hj20dmhGIZpoM-CCXazy1GioJ7QQajJwOODJXzmzbGr48LuBye7mbN_LRSwcSfLXySpAxZob7HbSiwrioAlXf-g_KccFHyb_Pcw2rLarwFiNwVR086n4XZrR_77EedkS0K6jkfVqArl_5qVq7nFXSatUOpOHeemE7PejtXUmxsy2kT48AbuO7FeVJOLgOsHHr794O4_dtHocZ1DlnIQDJb9hMk11moWH9Xnv6LBN6uLYHQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB9LsmcEMBJWtAOLORG1gz1vpJ5A7if_yKxexhJiNmqGw-ohshqOySEz6r_ikz6d2p960kfEVcesgSeyMoZhH2NJJwpu5w0vzQuH4CtgWkYZ4Wmn-iP2OVIn-bI9Vcu9BTunNkoxNhTLSrPSixwPFcb_jQM3hZlAvuPuQcp-12HpwVSC025egi0I8UrhnkMmruIqwCkOV3ihQ9f9nJhNrhH6rLhEYymLOMQ2W1rnQOFYT7cjSVLkpLw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5K6d79VJqXr1CIWoo7ySRye59Enc_KG3NzRN6ttSe5wP9pHdfKe_yCwx5cw7M9jdRyvNk0zMaFfxqDihon1MuIDBK93irmVZReCENdYyckuNGWsucW5lZhxQufz4qMnd0Ov7QgJLQ4OzTLYqWfFXgkRZ3G-wCbqmHt3ssVCmcsgItPyuiMbSBEevo65vkz3ZXa628BvFoIwDGfk3pupknTudAtKcBcNMYWm71FtpgbQ9ITbyE5PPx",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDYjFnDu7upXfulIgrX0o4FhIjLV36cz3V_3oAWD29QlL45ioopAQcmfSaW_n8bSSoZnn9m7-06wdePwJqfBi5okhBvxX3z_cqKyrMeo671zxDEtapa7_FIfAKAJ6UcXAh0HDS0TkjxBjLOz8RBqBF7yxHbigpCgKBJ5UwIetxrXbv3TqEDalRlYA4PUgHrFbyF7DSv2phls7F_wF1cYCKr5dExAibLepnLIyUahSEYF4bK2WH445hf",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCg140K0shrwbqz4WOtM46RS4LKNI3Ru2T4-lnaFURBkRGJBZIyBpXaMeNq_-1Dnc4u5Mm-T4bvRDNP7-6M9JLfHhqwZvZ9ypL5ggW8aPixUrhRrDFLKy6b8E93zs5XiFh5lvhWA_SF0VND6iX-AFvC54ZWCN21Npm46dtT3GK6qnkGkxVLgJYCjaOTAGnaTgtiYiJMH_05DFkKQdvL9danWMxAzYes_qCPoVoR6X6-KHwZascpfyyX"
];

export const INITIAL_PROJECTS: ProjectJob[] = [
  {
    id: "8f3c2a1e",
    name: "Living Room Reconstruction",
    description: "Multi-angle living room photogrammetry capture with floor-to-ceiling windows and fireplace hearth.",
    dateCreated: "29 Sep 2026, 10:24 PM",
    photographsCount: 42,
    status: "completed",
    currentStep: 5,
    thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1vhx_W01p9N-PjZHF8qdJU1qG8CIR0ZZMLu4jfLRlRo4YEzj1ZR66eolltByGm1HWEP2YKkgeq0lIQaI8E4pulRHXvnnO5YgY2rgpEp6Y1tjAIGM6USlNO8mcZAOXzkqCqOv_ByNVDYzq2Di2tjeGduPmgefFyvJK4Z5vwzIdlqd7qJ99C1ves1yzTRug2lOrqFnSTxhmZSa8T3YItszzvgZh6UHB24mdFnOI18xkWaytKjODEbty",
    modelFormat: "3D Gaussian Splat (.spz)",
    modelPath: "models/8f3c2a1e/splat_high_res.spz",
    shareUrl: "https://prism.app/share/8f3c2a1e",
    photos: INITIAL_PROJECT_PHOTOS
  },
  {
    id: "job-office-901",
    name: "Office Space",
    description: "Collaborative executive workspace with dual workstations, acoustic dividers, and credenza.",
    dateCreated: "10 Sep 2026, 04:12 PM",
    photographsCount: 36,
    status: "processing",
    currentStep: 3,
    thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4kTeO-lxm6EJVHrHh-Gbnhi5cNHDt5I5zWFntnFmAjQCeMK3ToQek1vou_nhbO3MznhF3rlyt7k6N6HmkP7Ws7Jr6veuBSmq6n3fIkw_UhJDWqkwU-75g_rbzmHAKXsfw13kGce46wK-Ci4rKSESX1JnX95okdvNEWg6TU5mG2APLw1mXgEaWHmb-B-2BdvVixhpfOYbJ2phPBo8_uuxh_il07C1vTCOKo7u4MUMCzftcGR2rKrc6",
    modelFormat: "3D Gaussian Splat (.spz)",
    modelPath: "models/job-office-901/active_reconstruction.spz",
    shareUrl: "https://prism.app/share/job-office-901",
    photos: INITIAL_PROJECT_PHOTOS.slice(0, 10)
  },
  {
    id: "job-apt-804",
    name: "Apartment Scan",
    description: "Open concept studio living and kitchen corner with island bench and pendant light series.",
    dateCreated: "08 Sep 2026, 11:45 AM",
    photographsCount: 28,
    status: "pending",
    currentStep: 1,
    thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFmziYhYKKHkm4Wd7JcawV_NuOu513TuoRfIktSiluGOTfTVBF7rihsB6uOt_c6IhoxhTbZo1fzX6Hoyz5jYA_ACz4tFRNAs4AqwKxRSLrY3a631_8mM3uY04qxqz93UvA-vfCT20pVmKuD3ksuEs2TRqaEqYq45uuRvrJQ06yX7umeIby3i7MoPPpXOZMscuXNJHtj8BlBW-ZM0IpVQp-4ZsP0bz4ER06SUl7THATITW5-Pl5antI",
    modelFormat: "3D Gaussian Splat (.spz)",
    modelPath: "models/job-apt-804/queued.spz",
    shareUrl: "https://prism.app/share/job-apt-804",
    photos: INITIAL_PROJECT_PHOTOS.slice(0, 8)
  },
  {
    id: "job-studio-701",
    name: "Studio Room",
    description: "Compact bedroom loft with natural lighting aperture and timber floorboard reflections.",
    dateCreated: "05 Sep 2026, 02:18 PM",
    photographsCount: 19,
    status: "failed",
    currentStep: 2,
    thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDi2m_d0QE55y0Z5G8EqZ5oUqV1Vud_hFad6bKpCOE98q7QHUEWAWrxGSJYObh5hhFnX4qmsaml2a30syQVjnDdB24egh1qkOZulS6YIEb5QFWydinOSfjC4McKEQ3vyUADmBFcaeg-C611MJMj_LbgGDxy4oJdGbeJw9zhiU8MmWBqXdnyKXDDImDHE8m6oqbztXlW58QL3mp259w_oP8km9xYt6TQVIw5KHyoQppbC3neU2Uf00kY",
    modelFormat: "3D Gaussian Splat (.spz)",
    modelPath: "models/job-studio-701/aborted.spz",
    shareUrl: "https://prism.app/share/job-studio-701",
    photos: INITIAL_PROJECT_PHOTOS.slice(0, 6)
  }
];

const STORAGE_KEY = "prism_projects_dataset_v1";

export function getStoredProjects(): ProjectJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function saveProjects(projects: ProjectJob[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to save projects to storage", e);
  }
}
