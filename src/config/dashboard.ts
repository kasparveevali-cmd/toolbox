export const dashboard = { name: "Minu Dashboard", timezone: "Europe/Tallinn" };
export const busConfig = {
  route: "25",
  agencyPattern: "Tallinna Linnatranspor[td]|TLT",
  directions: [
    {
      id: "outbound",
      origin: "Lennuki",
      destination: "Vana-Rannamõisa tee",
      originCode: "12301-1",
      destinationCode: "47226-1",
    },
    {
      id: "inbound",
      origin: "Vana-Rannamõisa tee",
      destination: "Lennuki",
      originCode: "47225-1",
      destinationCode: "13103-1",
    },
  ],
};
