class Log < ActiveRecord::Base
  # attr_accessible :title, :body
  belongs_to :group

  def test_number
    eval(message)["page"].split("test_number=")[1]
  end

  def color
    test_number_split = test_number.split "-"
    r = test_number_split[0].hash % 255
    g = test_number_split[1].hash % 255
    b = test_number_split[2].hash % 255

    return "rgb("+r.to_s+","+g.to_s+","+b.to_s+")"
  end
end
