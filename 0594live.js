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
      "https://raw.githubusercontent.com/******/txt/hotel/%E5%85%A8%E5%9B%BD.txt" // 新增监听地址
    ];

    let allChannels = [];

    async function fetchAndProcess(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`请求失败: ${url}`);
        const text = await response.text();
        const lines = text.split("\n");

        lines.forEach(line => {
          let parts = line.split(",");
          if (parts.length < 2) return;

          let name = parts[0].trim();
          let url = parts[1].trim();

          // 统一大小写
          name = name.toUpperCase();

          // 处理 CCTV 频道，去掉所有额外字符
          name = name.replace(/^CCTV[-\s]?(\d+).*/, "CCTV$1");

          // 处理带括号的频道，如 `北京卫视（高清）` → `北京卫视`
          name = name.replace(/\（.*?\）|\(.*?\)/g, "");

          // 确保 CCTV5 和 CCTV5+ 正确分类
          if (name.match(/^CCTV[-]?(5\+?)$/)) {
            name = name.replace("CCTV-", "CCTV");
          }

          // 只保留 tsfile/live 和 hls 的 URL
          if (!url.includes("tsfile/live") && !url.includes("hls")) return;

          // 去掉 m3u8 后面的参数
          url = url.replace(/(\.m3u8).*/, "$1");

          allChannels.push({ name, url });
        });
      } catch (error) {
        console.error(`获取失败: ${url}`);
      }
    }

    await Promise.all(urls.map(url => fetchAndProcess(url)));

    // 按顺序排列频道
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

    // 按 CCTV 预定义顺序排序
    cctvChannels.sort((a, b) => cctvOrder.indexOf(a.name) - cctvOrder.indexOf(b.name));

    // 其他频道按名称排序
    otherChannels.sort((a, b) => a.name.localeCompare(b.name));

    // 去重相同频道相同IP的
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