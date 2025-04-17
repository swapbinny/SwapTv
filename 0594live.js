export default {
  async fetch(request) {
    const urls = [
      "https://raw.githubusercontent.com*******heads/main/live.txt",
      "https://raw.githubusercontent.com/*******itvlist.txt",
      "https://raw.githubusercontent.com/******/iptv.txt",
      "https://raw.githubusercontent.com/******df.txt",
      "https://raw.githubusercontent.com/*******st1.txt",
      "https://raw.githubusercontent.com/*******result.txt",
      "https://ghproxy.net/raw.githubusercontent.com/*******t/result.txt",
      "https://raw.githubusercontent.com/******/txt/hotel/%E5%85%A8%E5%9B%BD.txt" // ����������ַ
    ];

    let allChannels = [];

    async function fetchAndProcess(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`����ʧ��: ${url}`);
        const text = await response.text();
        const lines = text.split("\n");

        lines.forEach(line => {
          let parts = line.split(",");
          if (parts.length < 2) return;

          let name = parts[0].trim();
          let url = parts[1].trim();

          // ͳһ��Сд
          name = name.toUpperCase();

          // ���� CCTV Ƶ����ȥ�����ж����ַ�
          name = name.replace(/^CCTV[-\s]?(\d+).*/, "CCTV$1");

          // ��������ŵ�Ƶ������ `�������ӣ����壩` �� `��������`
          name = name.replace(/\��.*?\��|\(.*?\)/g, "");

          // ȷ�� CCTV5 �� CCTV5+ ��ȷ����
          if (name.match(/^CCTV[-]?(5\+?)$/)) {
            name = name.replace("CCTV-", "CCTV");
          }

          // ֻ���� tsfile/live �� hls �� URL
          if (!url.includes("tsfile/live") && !url.includes("hls")) return;

          // ȥ�� m3u8 ����Ĳ���
          url = url.replace(/(\.m3u8).*/, "$1");

          allChannels.push({ name, url });
        });
      } catch (error) {
        console.error(`��ȡʧ��: ${url}`);
      }
    }

    await Promise.all(urls.map(url => fetchAndProcess(url)));

    // ��˳������Ƶ��
    const cctvOrder = [
      "CCTV1", "CCTV2", "CCTV3", "CCTV4", "CCTV5", "CCTV5+", "CCTV6",
      "CCTV7", "CCTV8", "CCTV9", "CCTV10", "CCTV11", "CCTV12", "CCTV13",
      "CCTV14", "CCTV15", "CCTV16", "CCTV17"
    ];

    let cctvChannels = [];
    let otherChannels = [];

    allChannels.forEach(channel => {
      if (cctvOrder.includes(channel.name)) {
        cctvChannels.push(channel);
      } else {
        otherChannels.push(channel);
      }
    });

    // �� CCTV Ԥ����˳������
    cctvChannels.sort((a, b) => cctvOrder.indexOf(a.name) - cctvOrder.indexOf(b.name));

    // ����Ƶ������������
    otherChannels.sort((a, b) => a.name.localeCompare(b.name));

    // ȥ����ͬƵ����ͬIP��
    let seen = new Set();
    let uniqueChannels = [...cctvChannels, ...otherChannels].filter(channel => {
      let key = `${channel.name},${channel.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return new Response(uniqueChannels.map(c => `${c.name},${c.url}`).join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};